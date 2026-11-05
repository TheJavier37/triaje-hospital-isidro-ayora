import { describe, it, expect } from 'vitest';
import {
  VITAL_SIGN_KEYS,
  parseNumericInput,
  validatePatientData,
  validateVitalSigns,
} from './vitalSignsValidation';
import type { VitalSigns } from '../types/triage';

const NORMAL: VitalSigns = {
  heartRate: 80, saturation: 98, systolicBP: 120, diastolicBP: 80, temperature: 36.5, respiratoryRate: 16,
};
const paciente = (over: Partial<Parameters<typeof validatePatientData>[0]> = {}) => ({
  fullName: 'Juan Pérez', id: '1104589231', age: 30, esiLevel: 3, vitalSigns: NORMAL, ...over,
});

describe('parseNumericInput', () => {
  it('campo vacío o texto no numérico es NaN (no se convierte en 0)', () => {
    expect(parseNumericInput('')).toBeNaN();
    expect(parseNumericInput('   ')).toBeNaN();
    expect(parseNumericInput('abc')).toBeNaN();
    expect(parseNumericInput('1e3')).toBeNaN();
  });
  it('acepta enteros, decimales y coma decimal', () => {
    expect(parseNumericInput('80')).toBe(80);
    expect(parseNumericInput('36.5')).toBe(36.5);
    expect(parseNumericInput('36,5')).toBe(36.5);
  });
});

describe('validateVitalSigns', () => {
  it('acepta valores normales y críticos reales', () => {
    expect(validateVitalSigns(NORMAL).isValid).toBe(true);
    expect(validateVitalSigns({ ...NORMAL, heartRate: 0, systolicBP: 0, diastolicBP: 0, respiratoryRate: 0 }).isValid).toBe(true);
  });

  for (const key of VITAL_SIGN_KEYS) {
    it(`${key}: rechaza valores negativos`, () => {
      const r = validateVitalSigns({ ...NORMAL, [key]: -1 });
      expect(r.isValid).toBe(false);
      expect(r.errors[key]).toBeTruthy();
    });
    it(`${key}: rechaza NaN e Infinity`, () => {
      expect(validateVitalSigns({ ...NORMAL, [key]: NaN }).errors[key]).toBeTruthy();
      expect(validateVitalSigns({ ...NORMAL, [key]: Infinity }).errors[key]).toBeTruthy();
    });
  }

  it('saturación no puede pasar de 100', () => {
    expect(validateVitalSigns({ ...NORMAL, saturation: 101 }).errors.saturation).toBeTruthy();
    expect(validateVitalSigns({ ...NORMAL, saturation: 100 }).isValid).toBe(true);
  });

  it('rechaza valores absurdos por error de digitación', () => {
    expect(validateVitalSigns({ ...NORMAL, heartRate: 900 }).errors.heartRate).toBeTruthy();
    expect(validateVitalSigns({ ...NORMAL, temperature: 365 }).errors.temperature).toBeTruthy();
    expect(validateVitalSigns({ ...NORMAL, temperature: 10 }).errors.temperature).toBeTruthy();
  });

  it('frecuencia cardíaca y respiratoria no admiten decimales; la temperatura admite uno', () => {
    expect(validateVitalSigns({ ...NORMAL, heartRate: 80.5 }).errors.heartRate).toBeTruthy();
    expect(validateVitalSigns({ ...NORMAL, respiratoryRate: 16.2 }).errors.respiratoryRate).toBeTruthy();
    expect(validateVitalSigns({ ...NORMAL, temperature: 36.55 }).errors.temperature).toBeTruthy();
    expect(validateVitalSigns({ ...NORMAL, temperature: 36.5 }).isValid).toBe(true);
  });

  it('la diastólica no puede ser mayor que la sistólica', () => {
    const r = validateVitalSigns({ ...NORMAL, systolicBP: 80, diastolicBP: 100 });
    expect(r.errors.diastolicBP).toBeTruthy();
    expect(validateVitalSigns({ ...NORMAL, systolicBP: 100, diastolicBP: 100 }).isValid).toBe(true);
  });
});

describe('validatePatientData', () => {
  it('acepta un paciente correcto', () => {
    expect(validatePatientData(paciente()).isValid).toBe(true);
  });
  it('nombre obligatorio, sin números y con longitud razonable', () => {
    expect(validatePatientData(paciente({ fullName: '   ' })).errors.fullName).toBeTruthy();
    expect(validatePatientData(paciente({ fullName: 'Ab' })).errors.fullName).toBeTruthy();
    expect(validatePatientData(paciente({ fullName: 'Juan 123' })).errors.fullName).toBeTruthy();
    expect(validatePatientData(paciente({ fullName: "María-José O'Neil" })).isValid).toBe(true);
    expect(validatePatientData(paciente({ fullName: 'Ñandú Peña' })).isValid).toBe(true);
  });
  it('cédula / ID obligatoria y sin espacios ni símbolos raros', () => {
    expect(validatePatientData(paciente({ id: '' })).errors.id).toBeTruthy();
    expect(validatePatientData(paciente({ id: '11 04' })).errors.id).toBeTruthy();
    expect(validatePatientData(paciente({ id: '110$%' })).errors.id).toBeTruthy();
    expect(validatePatientData(paciente({ id: 'abc-123' })).isValid).toBe(true);
  });
  it('edad: entera, no negativa y hasta 120', () => {
    expect(validatePatientData(paciente({ age: -5 })).errors.age).toBeTruthy();
    expect(validatePatientData(paciente({ age: 121 })).errors.age).toBeTruthy();
    expect(validatePatientData(paciente({ age: 30.5 })).errors.age).toBeTruthy();
    expect(validatePatientData(paciente({ age: NaN })).errors.age).toBeTruthy();
    expect(validatePatientData(paciente({ age: 0 })).isValid).toBe(true);
  });
  it('nivel ESI entre 1 y 5', () => {
    expect(validatePatientData(paciente({ esiLevel: 0 })).errors.esiLevel).toBeTruthy();
    expect(validatePatientData(paciente({ esiLevel: 6 })).errors.esiLevel).toBeTruthy();
  });
  it('incluye los errores de los signos vitales', () => {
    const r = validatePatientData(paciente({ vitalSigns: { ...NORMAL, heartRate: -3 } }));
    expect(r.isValid).toBe(false);
    expect(r.errors.heartRate).toBeTruthy();
  });
});

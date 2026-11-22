// Pruebas unitarias del dominio clínico — issue #4 (Ricardo Ochoa)

import { describe, it, expect } from 'vitest';
import {
  ESI_BASE_WEIGHTS,
  calculatePriorityScore,
  calculateVitalSignsPenalty,
  calculateWaitingTimeBonus,
  invertEsiLevel,
} from '../utils/esiCalculator';
import {
  isValidEcuadorianId,
  validatePatientData,
  validateVitalSigns,
} from '../utils/validators';
import { getInitialPatients } from '../mock/initialPatients';
import type { EsiLevel, VitalSigns } from '../types/triage';

const NORMAL: VitalSigns = {
  heartRate: 75,
  saturation: 98,
  systolicBP: 118,
  diastolicBP: 76,
  temperature: 36.8,
  respiratoryRate: 16,
};

const NOW = new Date('2026-11-20T10:00:00Z');
const minutesBefore = (m: number) => new Date(NOW.getTime() - m * 60_000);
const ESI_LEVELS: EsiLevel[] = [1, 2, 3, 4, 5];

describe('Inversión de la escala ESI', () => {
  it('invertEsiLevel aplica 6 - ESI (ESI 1 → 5, ESI 5 → 1)', () => {
    expect(ESI_LEVELS.map(invertEsiLevel)).toEqual([5, 4, 3, 2, 1]);
  });

  it('los pesos base conservan el orden de la inversión (ESI 1 > ESI 5)', () => {
    for (let level = 1; level < 5; level++) {
      expect(ESI_BASE_WEIGHTS[level as EsiLevel]).toBeGreaterThan(ESI_BASE_WEIGHTS[(level + 1) as EsiLevel]);
    }
  });
});

describe('Score base por nivel ESI (paciente estable, sin espera)', () => {
  it.each([
    [1, 1000],
    [2, 800],
    [3, 500],
    [4, 300],
    [5, 100],
  ])('ESI %i con signos normales → %i puntos', (esi, expected) => {
    expect(calculatePriorityScore(esi as EsiLevel, NORMAL, NOW, NOW)).toBe(expected);
  });

  it('un paciente ESI 1 siempre supera a un ESI 5 con los mismos signos', () => {
    expect(calculatePriorityScore(1, NORMAL, NOW, NOW)).toBeGreaterThan(calculatePriorityScore(5, NORMAL, NOW, NOW));
  });
});

describe('Penalizaciones fisiológicas escalonadas', () => {
  it('signos normales no penalizan', () => {
    expect(calculateVitalSignsPenalty(NORMAL)).toBe(0);
  });

  it('hipoxemia: la penalización crece cuando baja la SpO2', () => {
    const p = (saturation: number) => calculateVitalSignsPenalty({ ...NORMAL, saturation });
    expect(p(94)).toBe(50);
    expect(p(91)).toBe(130);
    expect(p(87)).toBe(220); // < 88 %
    expect(p(80)).toBe(350);
    expect(p(94)).toBeLessThan(p(91));
    expect(p(91)).toBeLessThan(p(87));
    expect(p(87)).toBeLessThan(p(80));
  });

  it('taquicardia severa (FC > 130) y colapso (FC > 150)', () => {
    // Se usa PAS alta (200) para que el índice de shock FC/PAS (< 0.8) no interfiera.
    const base = { ...NORMAL, systolicBP: 200, diastolicBP: 85 };
    const hr = (heartRate: number) => calculateVitalSignsPenalty({ ...base, heartRate }) - calculateVitalSignsPenalty({ ...base, heartRate: 75 });
    expect(hr(105)).toBe(40);
    expect(hr(120)).toBe(90);
    expect(hr(135)).toBe(180);
    expect(hr(155)).toBe(300);
  });

  it('crisis hipertensiva e hipotensión penalizan fuerte', () => {
    expect(calculateVitalSignsPenalty({ ...NORMAL, systolicBP: 210, diastolicBP: 125 })).toBe(300 + 160);
    // PAS 65 (300) + PAD 38 (160) + índice de shock 60/65 = 0.92 (75)
    expect(calculateVitalSignsPenalty({ ...NORMAL, systolicBP: 65, diastolicBP: 38, heartRate: 60 })).toBe(300 + 160 + 75);
  });

  it('fiebre alta e hipotermia', () => {
    expect(calculateVitalSignsPenalty({ ...NORMAL, temperature: 38.5 })).toBe(60);
    expect(calculateVitalSignsPenalty({ ...NORMAL, temperature: 39.5 })).toBe(140);
    expect(calculateVitalSignsPenalty({ ...NORMAL, temperature: 41 })).toBe(250);
    expect(calculateVitalSignsPenalty({ ...NORMAL, temperature: 33.5 })).toBe(250);
  });

  it('frecuencia respiratoria: taquipnea y apnea', () => {
    expect(calculateVitalSignsPenalty({ ...NORMAL, respiratoryRate: 24 })).toBe(80);
    expect(calculateVitalSignsPenalty({ ...NORMAL, respiratoryRate: 30 })).toBe(180);
    expect(calculateVitalSignsPenalty({ ...NORMAL, respiratoryRate: 4 })).toBe(300);
  });

  it('el índice de shock (FC/PAS ≥ 1) suma una penalización compuesta', () => {
    const v = { ...NORMAL, heartRate: 110, systolicBP: 105 };
    // FC 110 → leve (40) + PAS normal (0) + índice 1.05 → 180
    expect(calculateVitalSignsPenalty(v)).toBe(40 + 180);
  });

  it('valores no numéricos se ignoran en lugar de corromper el score', () => {
    expect(calculateVitalSignsPenalty({ ...NORMAL, heartRate: NaN })).toBe(0);
  });
});

describe('Deterioro hemodinámico repentino', () => {
  it('incrementa el Priority Score automáticamente al empeorar los signos', () => {
    const before = calculatePriorityScore(3, NORMAL, minutesBefore(10), NOW);
    const deteriorated: VitalSigns = {
      heartRate: 142,
      saturation: 84,
      systolicBP: 72,
      diastolicBP: 44,
      temperature: 36.0,
      respiratoryRate: 31,
    };
    const after = calculatePriorityScore(3, deteriorated, minutesBefore(10), NOW);
    expect(after).toBeGreaterThan(before);
    expect(after - before).toBe(calculateVitalSignsPenalty(deteriorated));
  });

  it('un ESI 3 con deterioro severo puede superar a un ESI 2 estable', () => {
    const critical3 = calculatePriorityScore(3, { ...NORMAL, saturation: 82, heartRate: 140, systolicBP: 70 }, NOW, NOW);
    const stable2 = calculatePriorityScore(2, NORMAL, NOW, NOW);
    expect(critical3).toBeGreaterThan(stable2);
  });
});

describe('Bonificación por tiempo de espera', () => {
  it('suma 2 puntos por cada 5 minutos completos', () => {
    expect(calculateWaitingTimeBonus(minutesBefore(4), NOW)).toBe(0);
    expect(calculateWaitingTimeBonus(minutesBefore(5), NOW)).toBe(2);
    expect(calculateWaitingTimeBonus(minutesBefore(59), NOW)).toBe(22);
  });

  it('una hora de llegada futura no resta prioridad', () => {
    expect(calculateWaitingTimeBonus(new Date(NOW.getTime() + 10 * 60_000), NOW)).toBe(0);
  });
});

describe('Validación de signos vitales (integridad de datos)', () => {
  it('acepta signos normales', () => {
    expect(validateVitalSigns(NORMAL).isValid).toBe(true);
  });

  it('rechaza SpO2 > 100 %', () => {
    expect(validateVitalSigns({ ...NORMAL, saturation: 101 }).errors.saturation).toBeDefined();
  });

  it('rechaza frecuencia cardíaca negativa', () => {
    expect(validateVitalSigns({ ...NORMAL, heartRate: -10 }).errors.heartRate).toBeDefined();
  });

  it('rechaza temperatura extrema', () => {
    expect(validateVitalSigns({ ...NORMAL, temperature: 55 }).errors.temperature).toBeDefined();
    expect(validateVitalSigns({ ...NORMAL, temperature: 20 }).errors.temperature).toBeDefined();
  });

  it('rechaza diastólica mayor o igual a la sistólica', () => {
    expect(validateVitalSigns({ ...NORMAL, systolicBP: 100, diastolicBP: 100 }).errors.diastolicBP).toBeDefined();
  });

  it('rechaza valores NaN y faltantes', () => {
    expect(validateVitalSigns({ ...NORMAL, heartRate: NaN }).isValid).toBe(false);
    expect(validateVitalSigns({ saturation: 98 }).isValid).toBe(false);
  });
});

describe('Cédula ecuatoriana', () => {
  it('acepta cédulas con dígito verificador correcto', () => {
    expect(isValidEcuadorianId('1105123457')).toBe(true);
    expect(isValidEcuadorianId('1103678916')).toBe(true);
  });

  it('rechaza dígito verificador incorrecto, provincia inválida y formato', () => {
    expect(isValidEcuadorianId('1105123458')).toBe(false);
    expect(isValidEcuadorianId('9905123457')).toBe(false);
    expect(isValidEcuadorianId('110512345')).toBe(false);
    expect(isValidEcuadorianId('11051234ab')).toBe(false);
  });

  it('en modo opcional solo valida el formato; en strictId verifica el dígito', () => {
    const data = { fullName: 'Ana Pérez', id: '1105123458', age: 30, vitalSigns: NORMAL };
    expect(validatePatientData(data).id).toBeUndefined();
    expect(validatePatientData(data, { strictId: true }).id).toBeDefined();
    expect(validatePatientData({ ...data, id: '' }, { strictId: true }).id).toBeDefined();
    expect(validatePatientData({ ...data, id: 'NN-123456' }, { strictId: true }).id).toBeUndefined();
  });
});

describe('Datos simulados (mock)', () => {
  const patients = getInitialPatients();

  it('incluye perfiles críticos (ESI 1–2) y estables (ESI 4–5)', () => {
    expect(patients.filter((p) => p.esiLevel <= 2).length).toBeGreaterThanOrEqual(8);
    expect(patients.filter((p) => p.esiLevel >= 4).length).toBeGreaterThanOrEqual(8);
  });

  it('todos los pacientes tienen signos válidos e IDs únicos', () => {
    for (const p of patients) {
      expect(validateVitalSigns(p.vitalSigns).errors).toEqual({});
    }
    expect(new Set(patients.map((p) => p.id)).size).toBe(patients.length);
  });

  it('los pacientes agregados tienen cédula válida', () => {
    const added = ['1105123457', '1103678916', '1104239874', '1102987656', '1101456323', '1105567810', '1106342106', '1107890129'];
    for (const id of added) {
      expect(patients.some((p) => p.id === id)).toBe(true);
      expect(isValidEcuadorianId(id)).toBe(true);
    }
  });
});

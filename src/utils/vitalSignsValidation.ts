// Validadores de datos de pacientes y signos vitales.
// Se usan en los formularios (ingreso y edición) y en el hook useTriageSystem,
// para que ningún valor imposible (negativos, fuera de rango, NaN) llegue al cálculo de prioridad.

import type { VitalSigns } from '../types/triage';

export type VitalSignKey = keyof VitalSigns;

export interface NumericLimit {
  label: string;     // Nombre para mensajes de error
  unit: string;      // Unidad (se muestra en el mensaje)
  min: number;       // Mínimo permitido (ningún signo puede ser negativo)
  max: number;       // Máximo permitido (detecta errores de digitación)
  decimals: 0 | 1;   // Decimales permitidos
}

/**
 * Límites fisiológicos amplios: permiten registrar pacientes críticos reales
 * (por ejemplo, FC o PA en 0 en paro) pero rechazan negativos y valores absurdos.
 * No son los rangos de "normalidad": esos están en esiCalculator.ts.
 */
export const VITAL_SIGN_LIMITS: Record<VitalSignKey, NumericLimit> = {
  heartRate:       { label: 'La frecuencia cardíaca',      unit: 'bpm',  min: 0,  max: 300, decimals: 0 },
  saturation:      { label: 'La saturación de oxígeno',    unit: '%',    min: 0,  max: 100, decimals: 0 },
  systolicBP:      { label: 'La presión sistólica',        unit: 'mmHg', min: 0,  max: 300, decimals: 0 },
  diastolicBP:     { label: 'La presión diastólica',       unit: 'mmHg', min: 0,  max: 200, decimals: 0 },
  temperature:     { label: 'La temperatura',              unit: '°C',   min: 25, max: 45,  decimals: 1 },
  respiratoryRate: { label: 'La frecuencia respiratoria',  unit: 'rpm',  min: 0,  max: 80,  decimals: 0 },
};

export const VITAL_SIGN_KEYS = Object.keys(VITAL_SIGN_LIMITS) as VitalSignKey[];

export const AGE_LIMIT: NumericLimit = { label: 'La edad', unit: 'años', min: 0, max: 120, decimals: 0 };

export type FormField = 'fullName' | 'id' | 'age' | 'esiLevel' | VitalSignKey;
export type FormErrors = Partial<Record<FormField, string>>;

export interface ValidationResult {
  isValid: boolean;
  errors: FormErrors;
}

export interface PatientInput {
  fullName: string;
  id: string;
  age: number;
  esiLevel: number;
  vitalSigns: VitalSigns;
}

/**
 * Convierte el texto de un input a número.
 * Un campo vacío o con texto no numérico devuelve NaN (así un campo vacío
 * ya no se interpreta como 0 sin avisar).
 */
export function parseNumericInput(raw: string): number {
  const text = raw.trim().replace(',', '.');
  return /^-?\d+(\.\d+)?$/.test(text) ? Number(text) : NaN;
}

/** Valida un número contra sus límites. Devuelve el mensaje de error o null si es válido. */
export function validateNumber(value: number, limit: NumericLimit): string | null {
  if (!Number.isFinite(value)) return `${limit.label} es obligatoria y debe ser un número válido`;
  if (value < 0) return `${limit.label} no puede ser negativa`;
  if (limit.decimals === 0 && !Number.isInteger(value)) return `${limit.label} debe ser un número entero`;
  if (limit.decimals === 1 && Math.abs(value * 10 - Math.round(value * 10)) > 1e-9) {
    return `${limit.label} admite como máximo un decimal`;
  }
  if (value < limit.min || value > limit.max) {
    return `${limit.label} debe estar entre ${limit.min} y ${limit.max} ${limit.unit}`;
  }
  return null;
}

/** Valida los 6 signos vitales y la coherencia entre presión sistólica y diastólica. */
export function validateVitalSigns(vitals: VitalSigns): ValidationResult {
  const errors: FormErrors = {};

  for (const key of VITAL_SIGN_KEYS) {
    const message = validateNumber(vitals[key], VITAL_SIGN_LIMITS[key]);
    if (message) errors[key] = message;
  }

  // La diastólica nunca puede ser mayor que la sistólica (solo se revisa si ambas son válidas).
  if (!errors.systolicBP && !errors.diastolicBP && vitals.diastolicBP > vitals.systolicBP) {
    errors.diastolicBP = 'La presión diastólica no puede ser mayor que la sistólica';
  }

  return { isValid: Object.keys(errors).length === 0, errors };
}

/** Valida el ingreso o edición completa de un paciente. */
export function validatePatientData(input: PatientInput): ValidationResult {
  const errors: FormErrors = { ...validateVitalSigns(input.vitalSigns).errors };

  const name = input.fullName.trim();
  if (name.length === 0) errors.fullName = 'El nombre es obligatorio';
  else if (name.length < 3 || name.length > 100) errors.fullName = 'El nombre debe tener entre 3 y 100 caracteres';
  else if (!/^\p{L}[\p{L}\s.'-]*$/u.test(name)) errors.fullName = 'El nombre solo puede contener letras';

  const id = input.id.trim();
  if (id.length === 0) errors.id = 'La cédula / ID es obligatoria';
  else if (!/^[A-Za-z0-9-]{3,40}$/.test(id)) errors.id = 'La cédula / ID solo admite letras, números y guiones (3 a 40 caracteres)';

  const ageError = validateNumber(input.age, AGE_LIMIT);
  if (ageError) errors.age = ageError;

  if (!Number.isInteger(input.esiLevel) || input.esiLevel < 1 || input.esiLevel > 5) {
    errors.esiLevel = 'El nivel ESI debe ser un entero entre 1 y 5';
  }

  return { isValid: Object.keys(errors).length === 0, errors };
}

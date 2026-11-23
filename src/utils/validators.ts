// src/utils/validators.ts
// Validación de integridad de datos clínicos (issue #4 — Ricardo Ochoa)

import type { VitalSigns, PatientFormInput } from '../types/triage';

export interface PatientFormErrors {
    id?: string;
    fullName?: string;
    name?: string;
    age?: string;
    spO2?: string;
    saturation?: string;
    heartRate?: string;
    systolicBP?: string;
    diastolicBP?: string;
    temperature?: string;
    respiratoryRate?: string;
}

export interface ValidationResult {
    isValid: boolean;
    errors: Record<string, string>;
}

/** Opciones de validación del formulario de registro. */
export interface ValidatePatientOptions {
    /**
     * Si es `true`, la cédula es obligatoria y se valida con el algoritmo
     * oficial del Registro Civil (módulo 10). Los IDs temporales `NN-xxx`
     * (pacientes no identificados) siguen permitidos.
     * Por defecto es `false`: la cédula es opcional y solo se valida el formato.
     */
    strictId?: boolean;
}

/** Un valor es utilizable solo si es un número finito (rechaza NaN, Infinity y undefined). */
const isNum = (value: unknown): value is number =>
    typeof value === 'number' && Number.isFinite(value);

/**
 * Valida una cédula ecuatoriana de 10 dígitos con el algoritmo módulo 10.
 *
 * Reglas:
 *  - Dos primeros dígitos: provincia (01–24) o 30 (ecuatorianos en el exterior).
 *  - Tercer dígito: menor a 6 (persona natural).
 *  - Dígito verificador: coeficientes 2,1,2,1,2,1,2,1,2 (si un producto > 9 se resta 9).
 *
 * @param id Cédula en texto.
 * @returns `true` si la cédula es válida.
 */
export function isValidEcuadorianId(id: string): boolean {
    if (!/^\d{10}$/.test(id)) return false;

    const province = Number(id.slice(0, 2));
    if (!((province >= 1 && province <= 24) || province === 30)) return false;
    if (Number(id[2]) >= 6) return false;

    let sum = 0;
    for (let i = 0; i < 9; i++) {
        let product = Number(id[i]) * (i % 2 === 0 ? 2 : 1);
        if (product > 9) product -= 9;
        sum += product;
    }
    const verifier = (10 - (sum % 10)) % 10;
    return verifier === Number(id[9]);
}

/**
 * Valida de forma aislada los rangos fisiológicos de los signos vitales.
 * Rechaza valores faltantes, no numéricos (NaN) y fisiológicamente imposibles
 * (SpO2 > 100 %, frecuencia cardíaca negativa, temperatura extrema, etc.).
 */
export function validateVitalSigns(vitals: Partial<VitalSigns>): ValidationResult {
    const errors: Record<string, string> = {};

    if (!isNum(vitals.heartRate) || vitals.heartRate < 30 || vitals.heartRate > 250) {
        errors.heartRate = 'Frecuencia Cardíaca debe estar entre 30 y 250 bpm.';
    }

    if (!isNum(vitals.saturation) || vitals.saturation < 50 || vitals.saturation > 100) {
        errors.saturation = 'La SpO2 debe estar entre 50% y 100%.';
    }

    if (!isNum(vitals.systolicBP) || vitals.systolicBP < 40 || vitals.systolicBP > 250) {
        errors.systolicBP = 'Presión Sistólica debe estar entre 40 y 250 mmHg.';
    }

    if (!isNum(vitals.diastolicBP) || vitals.diastolicBP < 20 || vitals.diastolicBP > 150) {
        errors.diastolicBP = 'Presión Diastólica debe estar entre 20 y 150 mmHg.';
    } else if (isNum(vitals.systolicBP) && vitals.diastolicBP >= vitals.systolicBP) {
        errors.diastolicBP = 'La presión diastólica debe ser menor a la sistólica.';
    }

    if (!isNum(vitals.temperature) || vitals.temperature < 30.0 || vitals.temperature > 45.0) {
        errors.temperature = 'La temperatura debe estar entre 30°C y 45°C.';
    }

    // La frecuencia respiratoria es opcional, pero si viene debe ser válida.
    if (vitals.respiratoryRate !== undefined && (!isNum(vitals.respiratoryRate) || vitals.respiratoryRate < 4 || vitals.respiratoryRate > 60)) {
        errors.respiratoryRate = 'Frecuencia Respiratoria debe estar entre 4 y 60 rpm.';
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors,
    };
}

/**
 * Valida los datos del formulario de registro completo.
 */
export const validatePatientData = (
    data: PatientFormInput,
    options: ValidatePatientOptions = {}
): PatientFormErrors => {
    const errors: PatientFormErrors = {};

  // Nombre (Obligatorio)
    const name = data.fullName || data.name;
    if (!name || name.trim().length < 2) {
        errors.fullName = 'El nombre o identificación inicial es obligatorio.';
        errors.name = 'El nombre o identificación inicial es obligatorio.';
    }

  // Cédula (opcional por defecto; obligatoria y verificada si strictId = true)
    const cleanId = (data.id ?? '').trim();
    if (cleanId !== '') {
        if (cleanId.startsWith('NN-')) {
            // ID temporal de paciente no identificado: se acepta.
        } else if (!/^\d{10}$/.test(cleanId)) {
            errors.id = 'La cédula debe tener 10 dígitos numéricos (o usar formato NN-xxx).';
        } else if (options.strictId && !isValidEcuadorianId(cleanId)) {
            errors.id = 'La cédula ingresada no es válida (dígito verificador incorrecto).';
        }
    } else if (options.strictId) {
        errors.id = 'La cédula es obligatoria.';
    }

  // Edad
    if (!isNum(data.age) || data.age < 0 || data.age > 120) {
        errors.age = 'La edad debe estar entre 0 y 120 años.';
    }

  // Signos Vitales
    const vitalsValidation = validateVitalSigns(data.vitalSigns ?? {});

    if (!vitalsValidation.isValid) {
        if (vitalsValidation.errors.heartRate) errors.heartRate = vitalsValidation.errors.heartRate;
        if (vitalsValidation.errors.saturation) {
            errors.saturation = vitalsValidation.errors.saturation;
            errors.spO2 = vitalsValidation.errors.saturation;
        }

        if (vitalsValidation.errors.systolicBP) errors.systolicBP = vitalsValidation.errors.systolicBP;
        if (vitalsValidation.errors.diastolicBP) errors.diastolicBP = vitalsValidation.errors.diastolicBP;
        if (vitalsValidation.errors.temperature) errors.temperature = vitalsValidation.errors.temperature;
        if (vitalsValidation.errors.respiratoryRate) errors.respiratoryRate = vitalsValidation.errors.respiratoryRate;
    }

    return errors;
};

// src/utils/validators.ts

import type { VitalSigns } from '../types/triage';

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

/**
 * Valida de forma aislada los rangos fisiológicos de los signos vitales.
 */
export function validateVitalSigns(vitals: VitalSigns): ValidationResult {
    const errors: Record<string, string> = {};

    if (vitals.heartRate < 30 || vitals.heartRate > 250) {
        errors.heartRate = 'Frecuencia Cardíaca debe estar entre 30 y 250 bpm.';
    }

    if (vitals.saturation < 50 || vitals.saturation > 100) {
        errors.saturation = 'La SpO2 debe estar entre 50% y 100%.';
    }

    if (vitals.systolicBP < 40 || vitals.systolicBP > 250) {
        errors.systolicBP = 'Presión Sistólica debe estar entre 40 y 250 mmHg.';
    }

    if (vitals.diastolicBP < 20 || vitals.diastolicBP > 150) {
        errors.diastolicBP = 'Presión Diastólica debe estar entre 20 y 150 mmHg.';
    } else if (vitals.diastolicBP >= vitals.systolicBP) {
        errors.diastolicBP = 'La presión diastólica debe ser menor a la sistólica.';
    }

    if (vitals.temperature < 30.0 || vitals.temperature > 45.0) {
        errors.temperature = 'La temperatura debe estar entre 30°C y 45°C.';
    }

    if (vitals.respiratoryRate !== undefined && (vitals.respiratoryRate < 4 || vitals.respiratoryRate > 60)) {
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
export const validatePatientData = (data: any): PatientFormErrors => {
    const errors: PatientFormErrors = {};

  // Nombre (Obligatorio)
    const name = data.fullName || data.name;
    if (!name || name.trim().length < 2) {
        errors.fullName = 'El nombre o identificación inicial es obligatorio.';
        errors.name = 'El nombre o identificación inicial es obligatorio.';
    }

  // Cédula (Opcional)
    if (data.id && data.id.trim() !== '') {
        const cleanId = data.id.trim();
        if (!/^\d{10}$/.test(cleanId) && !cleanId.startsWith('NN-')) {
            errors.id = 'La cédula debe tener 10 dígitos numéricos (o usar formato NN-xxx).';
        }
    }

  // Edad
    if (data.age === undefined || data.age < 0 || data.age > 120) {
        errors.age = 'La edad debe estar entre 0 y 120 años.';
    }

  // Signos Vitales
    const vitals = data.vitalSigns || {};
    const vitalsValidation = validateVitalSigns(vitals);

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
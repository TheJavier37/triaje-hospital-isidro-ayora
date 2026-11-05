// Author: TheJavier37

import type { VitalSigns, EsiLevel } from '../types/triage';

/**
 * Ponderación base según el nivel ESI.
 * ESI 1 (Emergencia vital) otorga la mayor prioridad base.
 */
const ESI_BASE_WEIGHTS: Record<EsiLevel, number> = {
  1: 1000, // Resucitación / Riesgo inminente de muerte
  2: 800,  // Muy urgente / Compromiso hemodinámico
  3: 500,  // Urgente
  4: 300,  // Menor
  5: 100,  // No urgente
};

/**
 * Revisa y penaliza múltiples rangos fisiológicos críticos.
 * Cuanto mayor sea el impacto clínico de la alteración, mayor es el puntaje acumulado.
 */
export function calculateVitalSignsPenalty(vitals: VitalSigns): number {
  let penalty = 0;

  // -------------------------------------------------------------
  // 1. FRECUENCIA CARDÍACA (bpm) - Normal: 60 - 100 bpm
  // -------------------------------------------------------------
  if (vitals.heartRate > 150 || vitals.heartRate < 35) {
    penalty += 300; // Colapso / Taquicardia o Bradicardia Extrema
  } else if (vitals.heartRate > 130 || vitals.heartRate < 42) {
    penalty += 180; // Severa
  } else if (vitals.heartRate > 110 || vitals.heartRate < 50) {
    penalty += 90;  // Moderada
  } else if (vitals.heartRate > 100 || vitals.heartRate < 55) {
    penalty += 40;  // Leve
  }

  // -------------------------------------------------------------
  // 2. SATURACIÓN DE OXÍGENO SpO2 (%) - Normal: >= 95%
  // -------------------------------------------------------------
  if (vitals.saturation < 85) {
    penalty += 350; // Hipoxia Crítica / Riesgo de Paro Respiratorio
  } else if (vitals.saturation < 89) {
    penalty += 220; // Hipoxia Severa
  } else if (vitals.saturation < 92) {
    penalty += 130; // Hipoxia Moderada
  } else if (vitals.saturation < 95) {
    penalty += 50;  // Desaturación Leve
  }

  // -------------------------------------------------------------
  // 3. PRESIÓN ARTERIAL SISTÓLICA (mmHg) - Normal: 90 - 120 mmHg
  // -------------------------------------------------------------
  if (vitals.systolicBP < 70 || vitals.systolicBP > 200) {
    penalty += 300; // Shock Hipovolémico / Crisis Hipertensiva Severa
  } else if (vitals.systolicBP < 85 || vitals.systolicBP > 175) {
    penalty += 180; // Hipotensión o Hipertensión Severa
  } else if (vitals.systolicBP < 90 || vitals.systolicBP > 150) {
    penalty += 90;  // Moderada
  } else if (vitals.systolicBP > 135) {
    penalty += 35;  // Pre-hipertensión / Alteración Leve
  }

  // -------------------------------------------------------------
  // 4. PRESIÓN ARTERIAL DIASTÓLICA (mmHg) - Normal: 60 - 80 mmHg
  // -------------------------------------------------------------
  if (vitals.diastolicBP > 120 || vitals.diastolicBP < 40) {
    penalty += 160; // Emergencia Diastólica
  } else if (vitals.diastolicBP > 100 || vitals.diastolicBP < 50) {
    penalty += 80;  // Alteración Severa
  } else if (vitals.diastolicBP > 90) {
    penalty += 40;  // Alteración Moderada
  }

  // -------------------------------------------------------------
  // 5. TEMPERATURA (°C) - Normal: 36.5°C - 37.5°C
  // -------------------------------------------------------------
  if (vitals.temperature > 40.5 || vitals.temperature < 34.0) {
    penalty += 250; // Hiperpirexia / Hipotermia Grave
  } else if (vitals.temperature > 39.0 || vitals.temperature < 35.0) {
    penalty += 140; // Fiebre Alta / Hipotermia Moderada
  } else if (vitals.temperature > 38.0 || vitals.temperature < 35.8) {
    penalty += 60;  // Febrícula / Tendencia a Hipotermia
  }

  // -------------------------------------------------------------
  // 6. FRECUENCIA RESPIRATORIA (rpm) - Normal: 12 - 20 rpm
  // -------------------------------------------------------------
  if (vitals.respiratoryRate > 36 || vitals.respiratoryRate < 6) {
    penalty += 300; // Falla Respiratoria Inminente / Apnea
  } else if (vitals.respiratoryRate > 28 || vitals.respiratoryRate < 9) {
    penalty += 180; // Taquipnea / Bradipnea Severa
  } else if (vitals.respiratoryRate > 22 || vitals.respiratoryRate < 11) {
    penalty += 80;  // Moderada
  }

  // -------------------------------------------------------------
  // 7. FACTOR CLÍNICO COMPUESTO: ÍNDICE DE SHOCK (FC / PAS)
  // -------------------------------------------------------------
  // Si el gasto cardíaco compensatorio falla (FC > PAS), sugiere Shock
  if (vitals.systolicBP > 0) {
    const shockIndex = vitals.heartRate / vitals.systolicBP;
    if (shockIndex >= 1.0) {
      penalty += 180; // Indicador de Shock Hipovolémico/Séptico
    } else if (shockIndex >= 0.8) {
      penalty += 75;  // Sospecha de inestabilidad hemodinámica
    }
  }

  return penalty;
}

/**
 * Otorga bonificación por minutos en espera para evitar inanición (starvation)
 * de pacientes con prioridades intermedias.
 */
export function calculateWaitingTimeBonus(arrivalTime: Date): number {
  const now = new Date();
  const waitingMinutes = Math.floor((now.getTime() - new Date(arrivalTime).getTime()) / (1000 * 60));
  // Adiciona 2 puntos por cada 5 minutos transcurridos
  return Math.floor(waitingMinutes / 5) * 2;
}

/**
 * Calcula el Priority Score final consumido por el Max-Heap[cite: 5, 6].
 */
export function calculatePriorityScore(
  esiLevel: EsiLevel,
  vitalSigns: VitalSigns,
  arrivalTime: Date
): number {
  const baseWeight = ESI_BASE_WEIGHTS[esiLevel];
  const vitalsPenalty = calculateVitalSignsPenalty(vitalSigns);
  const timeBonus = calculateWaitingTimeBonus(arrivalTime);

  return baseWeight + vitalsPenalty + timeBonus;
}
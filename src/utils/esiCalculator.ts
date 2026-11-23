// Author: TheJavier37
// Auditoría y documentación clínica: Ricardo Ochoa (issue #4)

import type { VitalSigns, EsiLevel } from '../types/triage';

/**
 * Inversión de la escala ESI.
 *
 * La escala ESI es "inversa" a la urgencia: el nivel 1 es el más grave y el 5
 * el menos grave. Para que un Max-Heap ponga primero al más crítico, la
 * prioridad debe crecer cuando el nivel ESI baja: `6 - ESI`
 * (ESI 1 → 5, ESI 2 → 4, ... ESI 5 → 1).
 *
 * @param esiLevel Nivel ESI (1 al 5).
 * @returns Rango de urgencia invertido: 5 (máxima) a 1 (mínima).
 */
export function invertEsiLevel(esiLevel: EsiLevel): number {
  return 6 - esiLevel;
}

/**
 * Ponderación base según el nivel ESI.
 * ESI 1 (Emergencia vital) otorga la mayor prioridad base.
 *
 * Es la versión escalada de `invertEsiLevel` (6 - ESI): conserva el mismo orden
 * (1 > 2 > 3 > 4 > 5) pero con separaciones grandes para que una alteración
 * hemodinámica severa en un nivel menos urgente pueda superar a un paciente
 * estable de un nivel más urgente.
 */
export const ESI_BASE_WEIGHTS: Record<EsiLevel, number> = {
  1: 1000, // Resucitación / Riesgo inminente de muerte
  2: 800,  // Muy urgente / Compromiso hemodinámico
  3: 500,  // Urgente
  4: 300,  // Menor
  5: 100,  // No urgente
};

/**
 * Peso clínico (puntos máximos de penalización) asignado a cada constante vital.
 *
 * | Constante               | Máx. | Justificación clínica                                  |
 * |-------------------------|------|--------------------------------------------------------|
 * | SpO2                    | 350  | Hipoxia crítica: riesgo inmediato de paro respiratorio |
 * | Frecuencia cardíaca     | 300  | Colapso: taquicardia/bradicardia extrema               |
 * | Presión sistólica       | 300  | Shock hipovolémico / crisis hipertensiva severa        |
 * | Frecuencia respiratoria | 300  | Falla respiratoria inminente / apnea                   |
 * | Temperatura             | 250  | Hiperpirexia / hipotermia grave                        |
 * | Presión diastólica      | 160  | Emergencia diastólica (menos determinante que la PAS)  |
 * | Índice de shock         | 180  | Factor compuesto FC/PAS: detecta shock compensado      |
 */
export const VITAL_SIGN_MAX_WEIGHTS = {
  saturation: 350,
  heartRate: 300,
  systolicBP: 300,
  respiratoryRate: 300,
  temperature: 250,
  diastolicBP: 160,
  shockIndex: 180,
} as const;

/**
 * Revisa y penaliza múltiples rangos fisiológicos críticos de forma escalonada
 * (leve → moderada → severa → crítica).
 * Cuanto mayor sea el impacto clínico de la alteración, mayor es el puntaje acumulado.
 *
 * Los valores no numéricos (NaN, Infinity) se ignoran para que un dato corrupto
 * no altere el score; la validación de entrada es responsabilidad de `validators.ts`.
 *
 * @param vitals Signos vitales del paciente.
 * @returns Penalización total acumulada (0 si todos los signos son normales).
 */
export function calculateVitalSignsPenalty(vitals: VitalSigns): number {
  let penalty = 0;

  // -------------------------------------------------------------
  // 1. FRECUENCIA CARDÍACA (bpm) - Normal: 60 - 100 bpm
  //    Peso clínico máximo: 300
  // -------------------------------------------------------------
  if (Number.isFinite(vitals.heartRate)) {
    if (vitals.heartRate > 150 || vitals.heartRate < 35) {
      penalty += 300; // Colapso / Taquicardia o Bradicardia Extrema
    } else if (vitals.heartRate > 130 || vitals.heartRate < 42) {
      penalty += 180; // Severa
    } else if (vitals.heartRate > 110 || vitals.heartRate < 50) {
      penalty += 90;  // Moderada
    } else if (vitals.heartRate > 100 || vitals.heartRate < 55) {
      penalty += 40;  // Leve
    }
  }

  // -------------------------------------------------------------
  // 2. SATURACIÓN DE OXÍGENO SpO2 (%) - Normal: >= 95%
  //    Peso clínico máximo: 350 (la hipoxia es la alteración más letal a corto plazo)
  // -------------------------------------------------------------
  if (Number.isFinite(vitals.saturation)) {
    if (vitals.saturation < 85) {
      penalty += 350; // Hipoxia Crítica / Riesgo de Paro Respiratorio
    } else if (vitals.saturation < 89) {
      penalty += 220; // Hipoxia Severa (< 88 %, umbral de hipoxemia)
    } else if (vitals.saturation < 92) {
      penalty += 130; // Hipoxia Moderada
    } else if (vitals.saturation < 95) {
      penalty += 50;  // Desaturación Leve
    }
  }

  // -------------------------------------------------------------
  // 3. PRESIÓN ARTERIAL SISTÓLICA (mmHg) - Normal: 90 - 120 mmHg
  //    Peso clínico máximo: 300
  // -------------------------------------------------------------
  if (Number.isFinite(vitals.systolicBP)) {
    if (vitals.systolicBP < 70 || vitals.systolicBP > 200) {
      penalty += 300; // Shock Hipovolémico / Crisis Hipertensiva Severa
    } else if (vitals.systolicBP < 85 || vitals.systolicBP > 175) {
      penalty += 180; // Hipotensión o Hipertensión Severa
    } else if (vitals.systolicBP < 90 || vitals.systolicBP > 150) {
      penalty += 90;  // Moderada
    } else if (vitals.systolicBP > 135) {
      penalty += 35;  // Pre-hipertensión / Alteración Leve
    }
  }

  // -------------------------------------------------------------
  // 4. PRESIÓN ARTERIAL DIASTÓLICA (mmHg) - Normal: 60 - 80 mmHg
  //    Peso clínico máximo: 160
  // -------------------------------------------------------------
  if (Number.isFinite(vitals.diastolicBP)) {
    if (vitals.diastolicBP > 120 || vitals.diastolicBP < 40) {
      penalty += 160; // Emergencia Diastólica
    } else if (vitals.diastolicBP > 100 || vitals.diastolicBP < 50) {
      penalty += 80;  // Alteración Severa
    } else if (vitals.diastolicBP > 90) {
      penalty += 40;  // Alteración Moderada
    }
  }

  // -------------------------------------------------------------
  // 5. TEMPERATURA (°C) - Normal: 36.5°C - 37.5°C
  //    Peso clínico máximo: 250
  // -------------------------------------------------------------
  if (Number.isFinite(vitals.temperature)) {
    if (vitals.temperature > 40.5 || vitals.temperature < 34.0) {
      penalty += 250; // Hiperpirexia / Hipotermia Grave
    } else if (vitals.temperature > 39.0 || vitals.temperature < 35.0) {
      penalty += 140; // Fiebre Alta / Hipotermia Moderada
    } else if (vitals.temperature > 38.0 || vitals.temperature < 35.8) {
      penalty += 60;  // Febrícula / Tendencia a Hipotermia
    }
  }

  // -------------------------------------------------------------
  // 6. FRECUENCIA RESPIRATORIA (rpm) - Normal: 12 - 20 rpm
  //    Peso clínico máximo: 300
  // -------------------------------------------------------------
  if (Number.isFinite(vitals.respiratoryRate)) {
    if (vitals.respiratoryRate > 36 || vitals.respiratoryRate < 6) {
      penalty += 300; // Falla Respiratoria Inminente / Apnea
    } else if (vitals.respiratoryRate > 28 || vitals.respiratoryRate < 9) {
      penalty += 180; // Taquipnea / Bradipnea Severa
    } else if (vitals.respiratoryRate > 22 || vitals.respiratoryRate < 11) {
      penalty += 80;  // Moderada
    }
  }

  // -------------------------------------------------------------
  // 7. FACTOR CLÍNICO COMPUESTO: ÍNDICE DE SHOCK (FC / PAS)
  //    Peso clínico máximo: 180. Normal: 0.5 - 0.7
  // -------------------------------------------------------------
  // Si el gasto cardíaco compensatorio falla (FC >= PAS), sugiere Shock
  if (Number.isFinite(vitals.heartRate) && Number.isFinite(vitals.systolicBP) && vitals.systolicBP > 0) {
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
 *
 * @param arrivalTime Hora de ingreso del paciente.
 * @param now Instante de referencia (por defecto, ahora). Permite pruebas deterministas.
 * @returns 2 puntos por cada 5 minutos completos de espera (nunca negativo).
 */
export function calculateWaitingTimeBonus(arrivalTime: Date, now: Date = new Date()): number {
  const waitingMinutes = Math.floor((now.getTime() - new Date(arrivalTime).getTime()) / (1000 * 60));
  // Una hora de llegada futura (reloj desfasado) no debe restar prioridad.
  if (!Number.isFinite(waitingMinutes) || waitingMinutes <= 0) return 0;
  // Adiciona 2 puntos por cada 5 minutos transcurridos
  return Math.floor(waitingMinutes / 5) * 2;
}

/**
 * Calcula el Priority Score final consumido por el Max-Heap.
 *
 * Score = peso base ESI + penalización por signos vitales + bonificación por espera.
 *
 * @param esiLevel Nivel ESI base (1 al 5).
 * @param vitalSigns Signos vitales actuales.
 * @param arrivalTime Hora de ingreso.
 * @param now Instante de referencia (opcional, para pruebas).
 */
export function calculatePriorityScore(
  esiLevel: EsiLevel,
  vitalSigns: VitalSigns,
  arrivalTime: Date,
  now: Date = new Date()
): number {
  const baseWeight = ESI_BASE_WEIGHTS[esiLevel];
  const vitalsPenalty = calculateVitalSignsPenalty(vitalSigns);
  const timeBonus = calculateWaitingTimeBonus(arrivalTime, now);

  return baseWeight + vitalsPenalty + timeBonus;
}

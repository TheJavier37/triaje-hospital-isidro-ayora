// Author: TheJavier37

import type { VitalSigns, EsiLevel } from '../types/triage';

const ESI_BASE_WEIGHTS: Record<EsiLevel, number> = {
  1: 1000,
  2: 800,
  3: 500,
  4: 300,
  5: 100,
};

/**
 * Banda de normalidad de un signo vital.
 * - Dentro de [normalMin, normalMax] la penalización es 0.
 * - Fuera de la banda crece de forma lineal y continua hasta `maxPenalty`,
 *   que se alcanza en el valor crítico (criticalMin / criticalMax) y ya no sube más.
 * Un lado puede omitirse si solo es peligroso en una dirección (ej. saturación).
 */
export interface PenaltyBand {
  normalMin?: number;
  normalMax?: number;
  criticalMin?: number;
  criticalMax?: number;
  maxPenalty: number;
}

// Los valores críticos y las penalizaciones máximas conservan los umbrales originales
// (FC 40/130, SpO2 88, PAS 80/180, Temp 35/39.5, FR 8/30); lo nuevo es que ahora
// la penalización sube poco a poco entre el límite normal y el crítico.
export const VITAL_PENALTY_BANDS = {
  heartRate:       { normalMin: 50, normalMax: 100, criticalMin: 40, criticalMax: 130, maxPenalty: 150 },
  saturation:      { normalMin: 94, criticalMin: 88, maxPenalty: 200 },
  systolicBP:      { normalMin: 90, normalMax: 140, criticalMin: 80, criticalMax: 180, maxPenalty: 150 },
  diastolicBP:     { normalMin: 60, normalMax: 90, criticalMin: 40, criticalMax: 120, maxPenalty: 60 },
  temperature:     { normalMin: 36.0, normalMax: 38.0, criticalMin: 35.0, criticalMax: 39.5, maxPenalty: 100 },
  respiratoryRate: { normalMin: 12, normalMax: 22, criticalMin: 8, criticalMax: 30, maxPenalty: 120 },
} satisfies Record<keyof VitalSigns, PenaltyBand>;

/** Penalización de un solo signo vital: 0 en rango normal, hasta maxPenalty en el valor crítico. */
export function gradualPenalty(value: number, band: PenaltyBand): number {
  if (!Number.isFinite(value)) return 0;

  let severity = 0; // 0 = normal, 1 = crítico

  if (band.normalMax !== undefined && band.criticalMax !== undefined && value > band.normalMax) {
    severity = (value - band.normalMax) / (band.criticalMax - band.normalMax);
  } else if (band.normalMin !== undefined && band.criticalMin !== undefined && value < band.normalMin) {
    severity = (band.normalMin - value) / (band.normalMin - band.criticalMin);
  }

  return band.maxPenalty * Math.min(1, Math.max(0, severity));
}

export function calculateVitalSignsPenalty(vitals: VitalSigns): number {
  const total =
    gradualPenalty(vitals.heartRate, VITAL_PENALTY_BANDS.heartRate) +
    gradualPenalty(vitals.saturation, VITAL_PENALTY_BANDS.saturation) +
    gradualPenalty(vitals.systolicBP, VITAL_PENALTY_BANDS.systolicBP) +
    gradualPenalty(vitals.diastolicBP, VITAL_PENALTY_BANDS.diastolicBP) +
    gradualPenalty(vitals.temperature, VITAL_PENALTY_BANDS.temperature) +
    gradualPenalty(vitals.respiratoryRate, VITAL_PENALTY_BANDS.respiratoryRate);

  // Se redondea al final para que el score siga siendo entero.
  return Math.round(total);
}

export function calculateWaitingTimeBonus(arrivalTime: Date): number {
  const now = new Date();
  const waitingMinutes = Math.floor((now.getTime() - new Date(arrivalTime).getTime()) / (1000 * 60));
  return Math.floor(waitingMinutes / 5);
}

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
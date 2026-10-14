// Author: TheJavier37

import type { VitalSigns, EsiLevel } from '../types/triage';

const ESI_BASE_WEIGHTS: Record<EsiLevel, number> = {
  1: 1000,
  2: 800,
  3: 500,
  4: 300,
  5: 100,
};

export function calculateVitalSignsPenalty(vitals: VitalSigns): number {
  let penalty = 0;

  // Frecuencia Cardíaca
  if (vitals.heartRate > 130 || vitals.heartRate < 40) penalty += 150;
  else if (vitals.heartRate > 100 || vitals.heartRate < 50) penalty += 75;

  // Saturación de Oxígeno
  if (vitals.saturation < 88) penalty += 200;
  else if (vitals.saturation < 94) penalty += 100;

  // Presión Sistólica
  if (vitals.systolicBP < 80 || vitals.systolicBP > 180) penalty += 150;
  else if (vitals.systolicBP < 90 || vitals.systolicBP > 140) penalty += 60;

  // Temperatura
  if (vitals.temperature > 39.5 || vitals.temperature < 35.0) penalty += 100;
  else if (vitals.temperature > 38.0) penalty += 40;

  // Frecuencia Respiratoria
  if (vitals.respiratoryRate > 30 || vitals.respiratoryRate < 8) penalty += 120;
  else if (vitals.respiratoryRate > 22) penalty += 50;

  return penalty;
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
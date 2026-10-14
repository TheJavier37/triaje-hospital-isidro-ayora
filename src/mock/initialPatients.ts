// Author: TheJavier37

import type { Patient } from '../types/triage';
import { calculatePriorityScore } from '../utils/esiCalculator';

const now = new Date();

export const INITIAL_PATIENTS_DATA: Omit<Patient, 'priorityScore'>[] = [
  {
    id: '1104589231',
    fullName: 'Mateo Yanangomez',
    age: 58,
    esiLevel: 2,
    vitalSigns: {
      heartRate: 115,
      saturation: 91,
      systolicBP: 160,
      diastolicBP: 95,
      temperature: 38.5,
      respiratoryRate: 24,
    },
    arrivalTime: new Date(now.getTime() - 25 * 60000), // Hace 25 min
    lastUpdated: new Date(now.getTime() - 25 * 60000),
  },
  {
    id: '1102345678',
    fullName: 'Jonathan Loaiza',
    age: 24,
    esiLevel: 4,
    vitalSigns: {
      heartRate: 75,
      saturation: 98,
      systolicBP: 110,
      diastolicBP: 70,
      temperature: 36.8,
      respiratoryRate: 16,
    },
    arrivalTime: new Date(now.getTime() - 10 * 60000), // Hace 10 min
    lastUpdated: new Date(now.getTime() - 10 * 60000),
  },
  {
    id: '1105987654',
    fullName: 'Dayana Guerrero',
    age: 67,
    esiLevel: 1,
    vitalSigns: {
      heartRate: 140,
      saturation: 85,
      systolicBP: 75,
      diastolicBP: 50,
      temperature: 35.5,
      respiratoryRate: 32,
    },
    arrivalTime: new Date(now.getTime() - 5 * 60000), // Hace 5 min
    lastUpdated: new Date(now.getTime() - 5 * 60000),
  },
  {
    id: '1101239876',
    fullName: 'Domminic Narvaez',
    age: 42,
    esiLevel: 3,
    vitalSigns: {
      heartRate: 88,
      saturation: 95,
      systolicBP: 130,
      diastolicBP: 85,
      temperature: 37.2,
      respiratoryRate: 18,
    },
    arrivalTime: new Date(now.getTime() - 40 * 60000), // Hace 40 min
    lastUpdated: new Date(now.getTime() - 40 * 60000),
  },
];

export function getInitialPatients(): Patient[] {
  return INITIAL_PATIENTS_DATA.map((p) => ({
    ...p,
    priorityScore: calculatePriorityScore(p.esiLevel, p.vitalSigns, p.arrivalTime),
  }));
}
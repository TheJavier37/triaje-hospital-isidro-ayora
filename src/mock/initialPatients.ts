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
  {
    id: '1103412567',
    fullName: 'Sofia Sarango',
    age: 31,
    esiLevel: 5,
    vitalSigns: {
      heartRate: 70,
      saturation: 99,
      systolicBP: 115,
      diastolicBP: 75,
      temperature: 36.6,
      respiratoryRate: 14,
    },
    arrivalTime: new Date(now.getTime() - 15 * 60000), // Hace 15 min
    lastUpdated: new Date(now.getTime() - 15 * 60000),
  },
  {
    id: '1104928173',
    fullName: 'Carlos Jaramillo',
    age: 72,
    esiLevel: 1,
    vitalSigns: {
      heartRate: 155,
      saturation: 82,
      systolicBP: 65,
      diastolicBP: 40,
      temperature: 36.0,
      respiratoryRate: 35,
    },
    arrivalTime: new Date(now.getTime() - 2 * 60000), // Hace 2 min
    lastUpdated: new Date(now.getTime() - 2 * 60000),
  },
  {
    id: '1102837495',
    fullName: 'Valeria Burneo',
    age: 29,
    esiLevel: 2,
    vitalSigns: {
      heartRate: 128,
      saturation: 89,
      systolicBP: 175,
      diastolicBP: 105,
      temperature: 39.1,
      respiratoryRate: 26,
    },
    arrivalTime: new Date(now.getTime() - 18 * 60000), // Hace 18 min
    lastUpdated: new Date(now.getTime() - 18 * 60000),
  },
  {
    id: '1105192834',
    fullName: 'Luis Castillo',
    age: 50,
    esiLevel: 3,
    vitalSigns: {
      heartRate: 92,
      saturation: 94,
      systolicBP: 138,
      diastolicBP: 88,
      temperature: 37.8,
      respiratoryRate: 20,
    },
    arrivalTime: new Date(now.getTime() - 50 * 60000), // Hace 50 min
    lastUpdated: new Date(now.getTime() - 50 * 60000),
  },
  {
    id: '1103948215',
    fullName: 'Andrea Valdivieso',
    age: 19,
    esiLevel: 4,
    vitalSigns: {
      heartRate: 78,
      saturation: 97,
      systolicBP: 112,
      diastolicBP: 72,
      temperature: 36.9,
      respiratoryRate: 16,
    },
    arrivalTime: new Date(now.getTime() - 30 * 60000), // Hace 30 min
    lastUpdated: new Date(now.getTime() - 30 * 60000),
  },
  {
    id: '1101827364',
    fullName: 'Jorge Quezada',
    age: 63,
    esiLevel: 2,
    vitalSigns: {
      heartRate: 122,
      saturation: 90,
      systolicBP: 185,
      diastolicBP: 110,
      temperature: 37.0,
      respiratoryRate: 28,
    },
    arrivalTime: new Date(now.getTime() - 12 * 60000), // Hace 12 min
    lastUpdated: new Date(now.getTime() - 12 * 60000),
  },
  {
    id: '1104738291',
    fullName: 'María José Armijos',
    age: 35,
    esiLevel: 3,
    vitalSigns: {
      heartRate: 84,
      saturation: 96,
      systolicBP: 125,
      diastolicBP: 80,
      temperature: 38.2,
      respiratoryRate: 18,
    },
    arrivalTime: new Date(now.getTime() - 60 * 60000), // Hace 60 min
    lastUpdated: new Date(now.getTime() - 60 * 60000),
  },
  {
    id: '1102947182',
    fullName: 'Pedro Cuenca',
    age: 48,
    esiLevel: 5,
    vitalSigns: {
      heartRate: 68,
      saturation: 98,
      systolicBP: 118,
      diastolicBP: 78,
      temperature: 36.5,
      respiratoryRate: 15,
    },
    arrivalTime: new Date(now.getTime() - 45 * 60000), // Hace 45 min
    lastUpdated: new Date(now.getTime() - 45 * 60000),
  },
  {
    id: '1105829137',
    fullName: 'Gabriel Vivanco',
    age: 22,
    esiLevel: 1,
    vitalSigns: {
      heartRate: 32,
      saturation: 79,
      systolicBP: 60,
      diastolicBP: 35,
      temperature: 34.8,
      respiratoryRate: 8,
    },
    arrivalTime: new Date(now.getTime() - 8 * 60000), // Hace 8 min
    lastUpdated: new Date(now.getTime() - 8 * 60000),
  },
  {
    id: '1103819274',
    fullName: 'Camila Riofrío',
    age: 40,
    esiLevel: 4,
    vitalSigns: {
      heartRate: 80,
      saturation: 98,
      systolicBP: 120,
      diastolicBP: 80,
      temperature: 37.0,
      respiratoryRate: 16,
    },
    arrivalTime: new Date(now.getTime() - 22 * 60000), // Hace 22 min
    lastUpdated: new Date(now.getTime() - 22 * 60000),
  },
  {
    id: '1104192837',
    fullName: 'Kevin Cueva',
    age: 27,
    esiLevel: 3,
    vitalSigns: {
      heartRate: 105,
      saturation: 93,
      systolicBP: 142,
      diastolicBP: 90,
      temperature: 38.7,
      respiratoryRate: 22,
    },
    arrivalTime: new Date(now.getTime() - 35 * 60000), // Hace 35 min
    lastUpdated: new Date(now.getTime() - 35 * 60000),
  },
];

export function getInitialPatients(): Patient[] {
  return INITIAL_PATIENTS_DATA.map((p) => ({
    ...p,
    priorityScore: calculatePriorityScore(p.esiLevel, p.vitalSigns, p.arrivalTime),
  }));
}
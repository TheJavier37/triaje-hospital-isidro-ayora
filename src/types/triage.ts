// Author: TheJavier37

export type EsiLevel = 1 | 2 | 3 | 4 | 5;

export interface VitalSigns {
  heartRate: number;        // Frecuencia cardíaca (bpm)
  saturation: number;       // Saturación de oxígeno SpO2 (%)
  systolicBP: number;       // Presión arterial sistólica (mmHg)
  diastolicBP: number;      // Presión arterial diastólica (mmHg)
  temperature: number;      // Temperatura (°C)
  respiratoryRate: number;  // Frecuencia respiratoria (rpm)
}

export interface Patient {
  id: string;               // Identificador único (Cédula o UUID)
  fullName: string;
  age: number;
  esiLevel: EsiLevel;       // Nivel ESI base (1 al 5)
  vitalSigns: VitalSigns;
  priorityScore: number;    // Score dinámico calculado para el Max-Heap
  arrivalTime: Date;        // Hora de ingreso
  lastUpdated: Date;        // Última actualización de signos vitales
  attendedAt?: Date;        // Hora de atención (opcional, si ya fue atendido)
}

export interface ReorderAlert {
  patientId: string;
  patientName: string;
  previousPosition: number;
  newPosition: number;
  reason: string;
  timestamp: Date;
}
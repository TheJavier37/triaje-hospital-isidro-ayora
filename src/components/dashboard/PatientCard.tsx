// Author: TheJavier37

import React from 'react';
import type { Patient } from '../../types/triage';

interface PatientCardProps {
  patient: Patient;
  position: number;
  onUpdateVitals: (patient: Patient) => void;
}

const ESI_COLORS: Record<number, string> = {
  1: 'bg-red-600 text-white',
  2: 'bg-orange-500 text-white',
  3: 'bg-yellow-400 text-black',
  4: 'bg-green-500 text-white',
  5: 'bg-blue-500 text-white',
};

export const PatientCard: React.FC<PatientCardProps> = ({ patient, position, onUpdateVitals }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <span className="text-2xl font-black text-gray-400 w-8 text-center">#{position}</span>
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-gray-800 text-lg">{patient.fullName}</h4>
            <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${ESI_COLORS[patient.esiLevel]}`}>
              ESI {patient.esiLevel}
            </span>
          </div>
          <p className="text-xs text-gray-500">
            ID: {patient.id} | Edad: {patient.age} años | Llegada: {new Date(patient.arrivalTime).toLocaleTimeString()}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 text-xs bg-gray-50 p-2 rounded border border-gray-100">
        <div><strong>FC:</strong> {patient.vitalSigns.heartRate} bpm</div>
        <div><strong>SpO2:</strong> {patient.vitalSigns.saturation}%</div>
        <div><strong>PA:</strong> {patient.vitalSigns.systolicBP}/{patient.vitalSigns.diastolicBP}</div>
        <div><strong>Temp:</strong> {patient.vitalSigns.temperature}°C</div>
      </div>

      <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
        <div className="text-right">
          <div className="text-xs text-gray-400 font-semibold">Priority Score</div>
          <div className="text-xl font-black text-indigo-600">{patient.priorityScore}</div>
        </div>
        <button
          onClick={() => onUpdateVitals(patient)}
          className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 font-semibold text-xs px-3 py-2 rounded transition"
        >
          Editar Signos
        </button>
      </div>
    </div>
  );
};
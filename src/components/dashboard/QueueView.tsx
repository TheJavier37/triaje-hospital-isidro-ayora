// Author: TheJavier37

import React from 'react';
import type { Patient } from '../../types/triage';
import { PatientCard } from './PatientCard';

interface QueueViewProps {
  queue: Patient[];
  onAttendNext: () => void;
  onUpdateVitals: (patient: Patient) => void;
}

export const QueueView: React.FC<QueueViewProps> = ({ queue, onAttendNext, onUpdateVitals }) => {
  return (
    <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Cola de Espera (Max-Heap)</h2>
          <p className="text-xs text-gray-500">Ordenada dinámicamente por severidad y ESI</p>
        </div>
        <button
          onClick={onAttendNext}
          disabled={queue.length === 0}
          className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white font-bold text-sm px-4 py-2 rounded-lg transition shadow"
        >
          Atender Siguiente (O(log n))
        </button>
      </div>

      {queue.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          No hay pacientes en cola de espera.
        </div>
      ) : (
        <div className="space-y-3">
          {queue.map((patient, index) => (
            <PatientCard
              key={patient.id}
              patient={patient}
              position={index + 1}
              onUpdateVitals={onUpdateVitals}
            />
          ))}
        </div>
      )}
    </div>
  );
};
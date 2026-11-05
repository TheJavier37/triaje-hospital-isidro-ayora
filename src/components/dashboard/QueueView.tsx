import React from 'react';
import { PatientCard } from './PatientCard';
import type { Patient } from '../../types/triage';

interface QueueViewProps {
  queue: Patient[];
  onAttendNext: () => void;
  onUpdateVitals: (patient: Patient) => void;
}

export const QueueView: React.FC<QueueViewProps> = ({ queue, onAttendNext, onUpdateVitals }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
      {/* Título y Botón Principal de Atención */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            Cola de Espera <span className="text-xs font-normal text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded-full border border-teal-500/20">(Max-Heap)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">Ordenada dinámicamente por severidad y nivel ESI</p>
        </div>

        <button
          onClick={onAttendNext}
          disabled={queue.length === 0}
          className="bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-bold text-xs px-4 py-2.5 rounded-xl transition shadow-lg shadow-emerald-500/20 active:scale-95 flex items-center justify-center gap-2"
        >
          <span>Atender Siguiente</span>
          <span className="text-[10px] font-mono bg-emerald-600/30 text-emerald-950 px-1.5 py-0.5 rounded">(O(log n))</span>
        </button>
      </div>

      {/* Lista de Tarjetas de Pacientes */}
      <div className="space-y-3">
        {queue.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-sm">No hay pacientes en cola de espera.</div>
        ) : (
          queue.map((patient, index) => (
            <PatientCard
              key={patient.id}
              patient={patient}
              position={index + 1}
              onUpdateVitals={onUpdateVitals}
            />
          ))
        )}
      </div>
    </div>
  );
};
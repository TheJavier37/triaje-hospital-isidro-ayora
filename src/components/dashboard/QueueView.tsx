import React from 'react';
import type { Patient } from '../../types/triage';
import { PatientCard } from './PatientCard';

interface QueueViewProps {
  queue: Patient[];
  onAttendNext: () => void;
  onUpdateVitals: (patient: Patient) => void;
}

export const QueueView: React.FC<QueueViewProps> = ({
  queue,
  onAttendNext,
  onUpdateVitals,
}) => {
  const rootPatient = queue.length > 0 ? queue[0] : null;

  return (
    <section className="bg-slate-900 rounded-2xl border border-slate-800/80 p-5 md:p-6 shadow-2xl space-y-6">

            {/* Cabecera de la Sección con Acción Principal */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-slate-100 tracking-tight">
              Cola de Prioridad en Tiempo Real
            </h2>
            <span className="bg-slate-950 text-cyan-400 font-mono text-[10px] font-bold px-2 py-0.5 rounded border border-cyan-500/30">
              Max-Heap Array
            </span>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Ranking dinámico recalculado en tiempo de ejecución O(log n) por severidad ESI y constantes hemodinámicas.
          </p>
        </div>

        {/* Botón Atender Siguiente sin etiqueta ROOT */}
        <button
          onClick={onAttendNext}
          disabled={queue.length === 0}
          className="w-full sm:w-auto bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed text-slate-950 font-mono font-bold text-xs uppercase tracking-wider px-6 py-3 rounded-xl transition-all duration-200 shadow-lg shadow-cyan-500/20 active:scale-95 flex items-center justify-center"
        >
          Atender Siguiente
        </button>
      </div>

      {/* Lista / Ranking de Tarjetas de Pacientes */}
      {queue.length === 0 ? (
        <div className="py-12 text-center bg-slate-950/50 rounded-xl border border-dashed border-slate-800/80 space-y-2">
          <div className="text-3xl text-slate-600 font-mono">⚡</div>
          <h3 className="text-sm font-bold text-slate-300">No hay pacientes en la cola de espera</h3>
          <p className="text-xs text-slate-500 font-mono">
            Utiliza el botón de registro para ingresar un nuevo paciente al Max-Heap.
          </p>
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

      {/* Pie Técnico explicativo de la Cola */}
      {rootPatient && (
        <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/60 flex items-center justify-between font-mono text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
            Próximo en ser atendido (Nodo Raíz): <strong className="text-slate-200">{rootPatient.fullName}</strong>
          </span>
          <span className="text-cyan-400 font-bold">Score Max: {rootPatient.priorityScore}</span>
        </div>
      )}
    </section>
  );
};
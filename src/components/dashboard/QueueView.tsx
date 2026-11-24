import React from 'react';
import type { Patient } from '../../types/triage';
import { PatientCard } from './PatientCard';

/**
 * Propiedades recibidas por el componente QueueView desde App.tsx.
 */
interface QueueViewProps {
  /** Lista ordenada de pacientes activos en la cola de prioridad (Max-Heap) recibida desde App.tsx. */
  queue: Patient[];
  /** Evento disparado al presionar "Atender Siguiente" para extraer y atender al paciente raíz de la cola. */
  onAttendNext: () => void;
  /** Evento propagado hacia PatientCard para abrir el modal de edición de signos vitales de un paciente específico. */
  onUpdateVitals: (patient: Patient) => void;
}

/**
 * Vista principal de la cola de prioridad en tiempo real del sistema de triaje.
 * Gestiona la jerarquía visual de pacientes ordenados por urgencia, el estado vacío
 * y la acción principal de atención clínica con control de estado deshabilitado.
 */
export const QueueView: React.FC<QueueViewProps> = ({
  queue,
  onAttendNext,
  onUpdateVitals,
}) => {
  const rootPatient = queue.length > 0 ? queue[0] : null;

  return (
    <section
      aria-label="Cola de prioridad de pacientes"
      className="bg-slate-900 rounded-2xl border border-slate-800 p-4 sm:p-5 md:p-6 shadow-2xl space-y-6"
    >
      {/* Cabecera de la Sección con Acción Principal */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-extrabold text-slate-50 tracking-tight">
              Cola de Prioridad en Tiempo Real
            </h2>
            <span className="bg-slate-950 text-cyan-300 font-mono text-xs font-bold px-2.5 py-0.5 rounded border border-cyan-500/40">
              Max-Heap Array ({queue.length})
            </span>
          </div>
          <p className="text-xs text-slate-300 font-mono mt-1.5 leading-relaxed">
            Ranking dinámico recalculado en tiempo de ejecución O(log n) por severidad ESI y constantes hemodinámicas.
          </p>
        </div>

        {/* Botón Atender Siguiente deshabilitado cuando la cola está vacía */}
        <button
          type="button"
          onClick={onAttendNext}
          disabled={queue.length === 0}
          aria-label={
            rootPatient
              ? `Atender al siguiente paciente: ${rootPatient.fullName}`
              : 'Atender siguiente paciente (cola vacía)'
          }
          className="w-full sm:w-auto shrink-0 bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-800 disabled:text-slate-400 disabled:border-slate-700 disabled:opacity-60 disabled:shadow-none disabled:cursor-not-allowed text-slate-950 font-mono font-bold text-xs uppercase tracking-wider px-6 py-3 rounded-xl transition-all duration-200 shadow-lg shadow-cyan-500/20 active:scale-95 focus:outline-none focus:ring-2 focus:ring-cyan-300 flex items-center justify-center cursor-pointer"
        >
          Atender Siguiente
        </button>
      </div>

      {/* Lista / Ranking de Tarjetas de Pacientes */}
      {queue.length === 0 ? (
        <div
          role="status"
          className="py-12 px-4 text-center bg-slate-950/70 rounded-xl border border-dashed border-slate-700 space-y-2"
        >
          <div className="text-3xl text-cyan-400/70 font-mono" aria-hidden="true">
            ⚡
          </div>
          <h3 className="text-sm font-bold text-slate-200">
            No hay pacientes en la cola de espera
          </h3>
          <p className="text-xs text-slate-300 font-mono max-w-md mx-auto">
            Utiliza el botón de registro superior para ingresar un nuevo paciente al Max-Heap.
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

      {/* Pie Técnico explicativo de la Cola (adaptable a móvil y escritorio) */}
      {rootPatient && (
        <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 font-mono text-xs text-slate-300">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0" aria-hidden="true" />
            <span>
              Próximo en ser atendido (Nodo Raíz):{' '}
              <strong className="text-slate-50">{rootPatient.fullName}</strong>
            </span>
          </span>
          <span className="text-cyan-300 font-bold shrink-0">
            Score Max: {rootPatient.priorityScore}
          </span>
        </div>
      )}
    </section>
  );
};
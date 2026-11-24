import React from 'react';
import type { Patient } from '../../types/triage';

/**
 * Representa un registro individual dentro del historial de pacientes atendidos.
 */
export interface AttendedItem {
  /** Datos clínicos y signos vitales finales del paciente al momento de ser atendido. */
  patient: Patient;
  /** Marca de tiempo exacta en la que el paciente fue extraído de la cola y atendido. */
  attendedAt: Date;
}

/**
 * Propiedades recibidas por el componente HistoryTable desde App.tsx.
 */
interface HistoryTableProps {
  /** Arreglo cronológico de pacientes ya atendidos provisto por el estado de App.tsx. */
  history: AttendedItem[];
}

/**
 * Mapa cromático unificado para los badges de severidad ESI (1 Crítico a 5 No urgente),
 * consistente con PatientCard.tsx para garantizar reconocimiento clínico inmediato.
 */
const ESI_BADGE_STYLES: Record<number, string> = {
  1: 'bg-red-950/80 text-red-200 border-red-500/70',
  2: 'bg-orange-950/80 text-orange-200 border-orange-500/60',
  3: 'bg-amber-950/80 text-amber-200 border-amber-500/60',
  4: 'bg-emerald-950/80 text-emerald-200 border-emerald-500/60',
  5: 'bg-cyan-950/80 text-cyan-200 border-cyan-500/60',
};

/**
 * Tabla responsiva del historial clínico de pacientes atendidos.
 * Implementa desplazamiento horizontal fluido en pantallas móviles y mantiene
 * alta legibilidad en las métricas vitales y niveles de urgencia ESI.
 */
export const HistoryTable: React.FC<HistoryTableProps> = ({ history }) => {
  return (
    <section
      aria-label="Historial de pacientes atendidos"
      className="bg-slate-900 rounded-2xl border border-slate-800 p-4 sm:p-5 md:p-6 shadow-2xl space-y-4"
    >
      {/* Encabezado del Historial */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-extrabold text-slate-50 tracking-tight">
              Historial de Atendidos
            </h2>
            <span className="text-[11px] font-mono font-bold text-emerald-300 bg-emerald-500/15 px-2.5 py-0.5 rounded border border-emerald-500/40 uppercase tracking-wider">
              Lista Enlazada Ordenada
            </span>
          </div>
          <p className="text-xs text-slate-300 font-mono mt-1.5 leading-relaxed">
            Registro cronológico lineal con tiempo de inserción O(1) y desvinculación explícita de punteros.
          </p>
        </div>

        <div className="text-xs font-mono text-slate-300 bg-slate-950 px-3.5 py-2 rounded-lg border border-slate-800 self-start sm:self-auto flex items-center gap-2 shrink-0">
          <span>Total Atendidos:</span>
          <strong className="text-emerald-300 font-bold text-sm tabular-nums">
            {history.length}
          </strong>
        </div>
      </div>

      {/* Estado Vacío / Tabla de Datos */}
      {history.length === 0 ? (
        <div
          role="status"
          className="bg-slate-950/70 border border-dashed border-slate-700 rounded-xl p-8 text-center space-y-2"
        >
          <div className="text-emerald-400/70 text-3xl font-mono" aria-hidden="true">
            📋
          </div>
          <p className="text-slate-200 font-bold text-sm">
            Aún no se ha atendido a ningún paciente
          </p>
          <p className="text-xs text-slate-300 font-mono max-w-md mx-auto">
            Los pacientes extraídos del nodo raíz (ROOT) del Max-Heap se registrarán secuencialmente aquí.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60">
          <table className="w-full min-w-[680px] text-left text-xs text-slate-200">
            <thead className="bg-slate-950 text-slate-300 font-mono uppercase text-[11px] tracking-wider border-b border-slate-800">
              <tr>
                <th scope="col" className="py-3 px-4 whitespace-nowrap">#</th>
                <th scope="col" className="py-3 px-4 whitespace-nowrap">Paciente / Cédula</th>
                <th scope="col" className="py-3 px-4 whitespace-nowrap">Nivel ESI</th>
                <th scope="col" className="py-3 px-4 whitespace-nowrap">Signos Vitales Finales</th>
                <th scope="col" className="py-3 px-4 whitespace-nowrap">Heap Score</th>
                <th scope="col" className="py-3 px-4 text-right whitespace-nowrap">Hora de Atención</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 font-sans">
              {history.map(({ patient, attendedAt }, index) => (
                <tr key={patient.id} className="hover:bg-slate-900/70 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-300 whitespace-nowrap">
                    #{index + 1}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="font-bold text-slate-50">{patient.fullName}</div>
                    <div className="text-[11px] font-mono text-slate-300 mt-0.5">
                      ID: {patient.id} • {patient.age} años
                    </div>
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span
                      className={`inline-block px-2 py-0.5 rounded font-mono text-[11px] font-bold border uppercase ${
                        ESI_BADGE_STYLES[patient.esiLevel] || ESI_BADGE_STYLES[5]
                      }`}
                    >
                      ESI-{patient.esiLevel}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-xs text-slate-200 tabular-nums whitespace-nowrap">
                    SpO2: <span className="font-bold text-cyan-300">{patient.vitalSigns.saturation}%</span>
                    {' | '}
                    FC: <span className="font-bold text-emerald-300">{patient.vitalSigns.heartRate}</span>
                    {' | '}
                    PA: <span className="font-bold text-slate-100">{patient.vitalSigns.systolicBP}/{patient.vitalSigns.diastolicBP}</span>
                    {' | '}
                    Temp: <span className="font-bold text-amber-300">{patient.vitalSigns.temperature}°C</span>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-black text-cyan-300 whitespace-nowrap">
                    {patient.priorityScore}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-xs font-semibold text-emerald-300 whitespace-nowrap">
                    {attendedAt ? new Date(attendedAt).toLocaleTimeString() : 'Atendido'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};
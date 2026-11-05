import React from 'react';
import type { Patient } from '../../types/triage';

export interface AttendedItem {
  patient: Patient;
  attendedAt: Date;
}

interface HistoryTableProps {
  history: AttendedItem[];
}

export const HistoryTable: React.FC<HistoryTableProps> = ({ history }) => {
  return (
    <section className="bg-slate-900 rounded-2xl border border-slate-800/80 p-5 md:p-6 shadow-2xl space-y-4">
      
      {/* Encabezado del Historial */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-slate-100 tracking-tight">
              Historial de Atendidos
            </h2>
            <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/30 uppercase tracking-wider">
              Lista Enlazada Ordenada
            </span>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Registro cronológico lineal con tiempo de inserción $O(1)$ y desvinculación explícita de punteros.
          </p>
        </div>

        <div className="text-xs font-mono text-slate-400 bg-slate-950 px-3 py-2 rounded-lg border border-slate-800 self-start sm:self-auto flex items-center gap-2">
          <span>Total Atendidos:</span>
          <strong className="text-emerald-400 font-bold text-sm tabular-nums">{history.length}</strong>
        </div>
      </div>

      {/* Estado Vacío / Tabla de Datos */}
      {history.length === 0 ? (
        <div className="bg-slate-950/60 border border-dashed border-slate-800/80 rounded-xl p-8 text-center space-y-2">
          <div className="text-slate-600 text-3xl font-mono">📋</div>
          <p className="text-slate-300 font-bold text-sm">Aún no se ha atendido a ningún paciente</p>
          <p className="text-xs text-slate-500 font-mono">
            Los pacientes extraídos del nodo raíz (ROOT) del Max-Heap se registrarán secuencialmente aquí.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-800/80 bg-slate-950/50">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 font-mono uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">#</th>
                <th className="py-3 px-4">Paciente / Cédula</th>
                <th className="py-3 px-4">Nivel ESI</th>
                <th className="py-3 px-4">Signos Vitales Finales</th>
                <th className="py-3 px-4">Heap Score</th>
                <th className="py-3 px-4 text-right">Hora de Atención</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {history.map(({ patient, attendedAt }, index) => (
                <tr key={patient.id} className="hover:bg-slate-900/60 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-500">
                    #{index + 1}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-100">{patient.fullName}</div>
                    <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                      ID: {patient.id} • {patient.age} yrs
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold border uppercase ${
                      patient.esiLevel === 1 ? 'bg-red-950/40 text-red-400 border-red-500/40' :
                      patient.esiLevel === 2 ? 'bg-orange-950/40 text-orange-400 border-orange-500/40' :
                      patient.esiLevel === 3 ? 'bg-amber-950/40 text-amber-300 border-amber-500/40' :
                      'bg-emerald-950/40 text-emerald-400 border-emerald-500/40'
                    }`}>
                      ESI-{patient.esiLevel}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[11px] text-slate-300 tabular-nums">
                    SpO2: <span className="text-cyan-400">{patient.vitalSigns.saturation}%</span> | FC: <span className="text-emerald-400">{patient.vitalSigns.heartRate}</span> | PA: {patient.vitalSigns.systolicBP}/{patient.vitalSigns.diastolicBP}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-black text-cyan-400">
                    {patient.priorityScore}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-xs font-semibold text-emerald-400">
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
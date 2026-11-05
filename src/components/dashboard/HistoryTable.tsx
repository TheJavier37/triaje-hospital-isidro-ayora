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
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
      {/* Encabezado del Historial */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            Historial de Atendidos{' '}
            <span className="text-xs font-normal text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
              Lista Enlazada
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Estructura: Lista Enlazada ordenada cronológicamente
          </p>
        </div>
        <div className="text-xs text-slate-400 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 self-start sm:self-auto">
          Total Atendidos: <strong className="text-emerald-400 font-bold">{history.length}</strong>
        </div>
      </div>

      {/* Estado Vacío / Tabla de Datos */}
      {history.length === 0 ? (
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-8 text-center space-y-2">
          <div className="text-slate-500 text-3xl">📋</div>
          <p className="text-slate-200 font-semibold text-sm">Aún no se ha atendido a ningún paciente.</p>
          <p className="text-xs text-slate-400">
            Los pacientes atendidos desde la cola Max-Heap aparecerán registrados aquí de forma secuencial.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">#</th>
                <th className="py-3 px-4">Paciente / ID</th>
                <th className="py-3 px-4">Nivel ESI</th>
                <th className="py-3 px-4">Signos Vitales Finales</th>
                <th className="py-3 px-4">Prioridad</th>
                <th className="py-3 px-4 text-right">Hora de Atención</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {history.map(({ patient, attendedAt }, index) => (
                <tr key={patient.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3.5 px-4 font-bold text-slate-500">#{index + 1}</td>
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-100">{patient.fullName}</div>
                    <div className="text-[11px] text-slate-400">ID: {patient.id} | {patient.age} años</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-800 text-slate-200 border border-slate-700">
                      ESI {patient.esiLevel}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[11px] text-slate-300">
                    FC: {patient.vitalSigns.heartRate} bpm | SpO2: {patient.vitalSigns.saturation}% | PA: {patient.vitalSigns.systolicBP}/{patient.vitalSigns.diastolicBP}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-indigo-400">
                    {patient.priorityScore}
                  </td>
                  <td className="py-3.5 px-4 text-right font-medium text-emerald-400">
                    {attendedAt ? new Date(attendedAt).toLocaleTimeString() : 'Atendido'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
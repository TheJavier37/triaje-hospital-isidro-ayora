// Author: TheJavier37

import React from 'react';
import type { Patient } from '../../types/triage';

interface HistoryTableProps {
  history: { patient: Patient; attendedAt: Date }[];
}

export const HistoryTable: React.FC<HistoryTableProps> = ({ history }) => {
  return (
    <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 mt-6">
      <h2 className="text-xl font-bold text-gray-800 mb-1">Historial de Atendidos</h2>
      <p className="text-xs text-gray-500 mb-4">Estructura: Lista Enlazada Ordenada cronológicamente</p>

      {history.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-6">Aún no se ha atendido a ningún paciente.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-xs uppercase text-gray-400">
              <tr>
                <th className="p-3">Paciente</th>
                <th className="p-3">Cédula</th>
                <th className="p-3">ESI</th>
                <th className="p-3">Hora de Atención</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {history.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="p-3 font-semibold text-gray-800">{item.patient.fullName}</td>
                  <td className="p-3">{item.patient.id}</td>
                  <td className="p-3">ESI {item.patient.esiLevel}</td>
                  <td className="p-3 text-xs text-gray-500">{new Date(item.attendedAt).toLocaleTimeString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
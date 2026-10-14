// Author: TheJavier37

import React from 'react';
import type { ReorderAlert } from '../../types/triage';

interface AlertBannerProps {
  alerts: ReorderAlert[];
  onClear: () => void;
}

export const AlertBanner: React.FC<AlertBannerProps> = ({ alerts, onClear }) => {
  if (alerts.length === 0) return null;

  return (
    <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-6 rounded shadow-md">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-amber-800 font-bold text-lg flex items-center gap-2">
          <span>⚠️</span> Alertas de Re-categorización Dinámica (Heapify)
        </h3>
        <button
          onClick={onClear}
          className="text-xs bg-amber-200 text-amber-800 px-2 py-1 rounded hover:bg-amber-300 transition"
        >
          Limpiar Alertas
        </button>
      </div>
      <div className="space-y-2 max-h-40 overflow-y-auto">
        {alerts.map((alert, index) => (
          <div key={index} className="text-sm text-amber-900 bg-amber-100/60 p-2 rounded">
            <strong>{alert.patientName}</strong> cambió de la posición #{alert.previousPosition} a la 
            <span className="font-bold text-red-700"> #{alert.newPosition}</span>.
            <span className="block text-xs text-amber-700">{alert.reason} - {new Date(alert.timestamp).toLocaleTimeString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
import React from 'react';
import type { ReorderAlert } from '../../types/triage';

interface AlertBannerProps {
  alerts: ReorderAlert[];
  onClear: () => void;
}

export const AlertBanner: React.FC<AlertBannerProps> = ({ alerts, onClear }) => {
  if (alerts.length === 0) return null;

  return (
    <div className="bg-amber-950/20 border border-amber-500/40 p-4 rounded-xl shadow-lg space-y-3">
      {/* Cabecera de Alerta */}
      <div className="flex justify-between items-center pb-2 border-b border-amber-500/20">
        <h3 className="text-amber-400 font-bold text-sm tracking-tight flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
          <span> Alertas de Re-categorización Dinámica (Heapify)</span>
        </h3>
        <button
          onClick={onClear}
          className="text-[11px] font-mono font-semibold bg-amber-950/80 hover:bg-amber-900/60 text-amber-300 border border-amber-500/30 px-2.5 py-1 rounded-lg transition"
        >
          Limpiar Alertas
        </button>
      </div>

      {/* Listado de Notificaciones de Movimiento en el Heap */}
      <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
        {alerts.map((alert, index) => (
          <div 
            key={index} 
            className="text-xs bg-slate-950/80 border border-slate-800 p-2.5 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-slate-300"
          >
            <div>
              <strong className="text-slate-100 font-semibold">{alert.patientName}</strong> cambió de la posición{' '}
              <span className="font-mono text-slate-400">#{alert.previousPosition}</span> a la{' '}
              <span className="font-mono font-bold text-cyan-400">#{alert.newPosition}</span> en el Heap.
              <span className="block text-[11px] font-mono text-amber-400/90 mt-0.5">{alert.reason}</span>
            </div>
            <span className="font-mono text-[10px] text-slate-500 self-end sm:self-center">
              {new Date(alert.timestamp).toLocaleTimeString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
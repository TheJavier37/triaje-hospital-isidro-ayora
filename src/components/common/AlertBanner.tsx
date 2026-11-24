import React from 'react';
import type { ReorderAlert } from '../../types/triage';

/**
 * Propiedades recibidas por el componente AlertBanner desde App.tsx.
 */
interface AlertBannerProps {
  /** Lista de alertas generadas cuando un paciente cambia de posición en el Max-Heap tras actualizar sus signos vitales. */
  alerts: ReorderAlert[];
  /** Evento disparado al hacer clic en "Limpiar Alertas" para vaciar el historial de notificaciones de reordenamiento. */
  onClear: () => void;
}

/**
 * Banner de notificaciones clínicas en tiempo real que informa sobre cambios
 * de prioridad y movimientos de posición (Heapify) dentro de la cola de triaje.
 */
export const AlertBanner: React.FC<AlertBannerProps> = ({ alerts, onClear }) => {
  if (alerts.length === 0) return null;

  return (
    <div
      role="region"
      aria-live="polite"
      aria-label="Alertas de re-categorización dinámica"
      className="bg-amber-950/45 border border-amber-500/60 p-4 rounded-xl shadow-lg space-y-3"
    >
      {/* Cabecera de Alerta */}
      <div className="flex flex-wrap justify-between items-center gap-2 pb-2.5 border-b border-amber-500/30">
        <h3 className="text-amber-300 font-bold text-sm tracking-tight flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" aria-hidden="true" />
          <span>Alertas de Re-categorización Dinámica (Heapify)</span>
        </h3>
        <button
          type="button"
          onClick={onClear}
          aria-label="Limpiar todas las alertas de re-categorización"
          className="text-xs font-mono font-semibold bg-amber-950 hover:bg-amber-900/80 text-amber-200 border border-amber-500/50 px-3 py-1 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-300 transition shrink-0 cursor-pointer"
        >
          Limpiar Alertas
        </button>
      </div>

      {/* Listado de Notificaciones de Movimiento en el Heap */}
      <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
        {alerts.map((alert, index) => (
          <div
            key={`${alert.patientName}-${alert.timestamp}-${index}`}
            className="text-xs bg-slate-950/90 border border-slate-800 p-2.5 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-slate-200"
          >
            <div>
              <strong className="text-slate-50 font-semibold">{alert.patientName}</strong> cambió de la posición{' '}
              <span className="font-mono text-slate-300 font-semibold">#{alert.previousPosition}</span> a la{' '}
              <span className="font-mono font-bold text-cyan-300">#{alert.newPosition}</span> en el Heap.
              <span className="block text-[11px] font-mono text-amber-300 mt-0.5">{alert.reason}</span>
            </div>
            <span className="font-mono text-[11px] text-slate-300 self-end sm:self-center shrink-0">
              {new Date(alert.timestamp).toLocaleTimeString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
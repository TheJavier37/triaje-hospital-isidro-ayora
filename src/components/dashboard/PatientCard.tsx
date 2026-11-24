import React from 'react';
import type { Patient } from '../../types/triage';

/**
 * Propiedades recibidas por el componente PatientCard desde QueueView / App.tsx.
 */
interface PatientCardProps {
  /** Objeto con los datos demográficos, nivel ESI, puntuación de prioridad y signos vitales del paciente. */
  patient: Patient;
  /** Posición ordinal del paciente dentro de la cola de prioridad (1 indica el siguiente a ser atendido). */
  position: number;
  /** Evento disparado al hacer clic en "Ajustar Signos" para abrir el modal de edición de signos vitales. */
  onUpdateVitals: (patient: Patient) => void;
}

/**
 * Mapa de estilos Tailwind para los badges de severidad clínica (ESI 1 Crítico hasta ESI 5 No urgente),
 * garantizando alto contraste y consistencia cromática en todo el dashboard.
 */
const ESI_STYLES: Record<number, string> = {
  1: 'bg-red-950/80 text-red-200 border-red-500/70 shadow-lg shadow-red-500/10 animate-pulse',
  2: 'bg-orange-950/80 text-orange-200 border-orange-500/60',
  3: 'bg-amber-950/80 text-amber-200 border-amber-500/60',
  4: 'bg-emerald-950/80 text-emerald-200 border-emerald-500/60',
  5: 'bg-cyan-950/80 text-cyan-200 border-cyan-500/60',
};

/**
 * Mapa de colores para el indicador lateral vertical según el nivel ESI del paciente.
 */
const ESI_BAR_COLORS: Record<number, string> = {
  1: 'bg-red-500',
  2: 'bg-orange-500',
  3: 'bg-amber-500',
  4: 'bg-emerald-500',
  5: 'bg-cyan-500',
};

/**
 * Tarjeta individual de paciente en la cola de triaje.
 * Presenta jerarquía visual clara (regla 60-30-10), lectura clínica rápida de signos vitales
 * y acceso directo a la actualización de parámetros fisiológicos.
 */
export const PatientCard: React.FC<PatientCardProps> = ({ patient, position, onUpdateVitals }) => {
  const isRoot = position === 1;
  const isCritical = patient.esiLevel === 1 || patient.vitalSigns.saturation < 90;

  return (
    <div
      className={`relative overflow-hidden rounded-xl border p-4 transition-all duration-200 bg-slate-900/95 border-slate-800 hover:border-cyan-500/50 ${
        isCritical ? 'border-red-500/70 bg-red-950/25' : ''
      }`}
    >
      {/* Indicador lateral de severidad ESI (consistente del nivel 1 al 5) */}
      <div
        className={`absolute top-0 left-0 bottom-0 w-1.5 ${
          ESI_BAR_COLORS[patient.esiLevel] || 'bg-cyan-500'
        }`}
      />

      <div className="pl-2 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        {/* Identificación y Posición en el Max-Heap */}
        <div className="flex items-center gap-3">
          <span
            className={`font-mono text-xs font-bold px-2.5 py-1 rounded border shrink-0 ${
              isRoot
                ? 'bg-cyan-500/15 text-cyan-300 border-cyan-400/50 shadow-sm shadow-cyan-500/20'
                : 'bg-slate-950 text-slate-300 border-slate-700'
            }`}
          >
            #{position} {isRoot && 'PRIORIDAD'}
          </span>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="font-bold text-slate-50 text-base tracking-tight">{patient.fullName}</h4>
              <span
                className={`px-2 py-0.5 text-[11px] font-mono font-bold rounded-md border uppercase tracking-wider ${
                  ESI_STYLES[patient.esiLevel] || ESI_STYLES[5]
                }`}
              >
                ESI-{patient.esiLevel}
              </span>
            </div>
            <p className="font-mono text-xs text-slate-300 mt-0.5">
              ID: {patient.id} • {patient.age} años
            </p>
          </div>
        </div>

        {/* Telemetría de Constantes Vitales con alto contraste y responsividad móvil */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-950 p-2.5 rounded-lg border border-slate-800 font-mono text-center text-xs tabular-nums w-full lg:w-auto">
          <div className="px-2">
            <span className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
              SpO2
            </span>
            <span
              className={`text-sm font-bold ${
                patient.vitalSigns.saturation < 90 ? 'text-red-400' : 'text-cyan-300'
              }`}
            >
              {patient.vitalSigns.saturation}%
            </span>
          </div>
          <div className="px-2 border-l border-slate-800">
            <span className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
              FC
            </span>
            <span className="text-sm font-bold text-emerald-300">
              {patient.vitalSigns.heartRate}{' '}
              <span className="text-[10px] text-slate-300 font-normal">bpm</span>
            </span>
          </div>
          <div className="px-2 sm:border-l border-slate-800">
            <span className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
              PA
            </span>
            <span className="text-sm font-bold text-slate-100">
              {patient.vitalSigns.systolicBP}/{patient.vitalSigns.diastolicBP}
            </span>
          </div>
          <div className="px-2 border-l border-slate-800">
            <span className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
              Temp
            </span>
            <span className="text-sm font-bold text-amber-300">
              {patient.vitalSigns.temperature}°C
            </span>
          </div>
        </div>

        {/* Priority Score del Max-Heap y Acción */}
        <div className="flex items-center gap-4 w-full lg:w-auto justify-between lg:justify-end border-t lg:border-t-0 border-slate-800 pt-2.5 lg:pt-0">
          <div className="text-left lg:text-right">
            <span className="block font-mono text-[11px] text-slate-300 font-semibold uppercase tracking-wider">
              Heap Score
            </span>
            <span className="font-mono text-lg font-black text-cyan-300">
              {patient.priorityScore}
            </span>
          </div>

          <button
            type="button"
            onClick={() => onUpdateVitals(patient)}
            aria-label={`Ajustar signos vitales de ${patient.fullName}`}
            className="bg-slate-950 hover:bg-slate-800 text-cyan-300 font-mono text-xs font-semibold px-3.5 py-2 rounded-lg border border-cyan-500/40 hover:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 transition cursor-pointer"
          >
            Ajustar Signos
          </button>
        </div>
      </div>
    </div>
  );
};
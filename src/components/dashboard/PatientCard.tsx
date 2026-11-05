import React from 'react';
import type { Patient } from '../../types/triage';

interface PatientCardProps {
  patient: Patient;
  position: number;
  onUpdateVitals: (patient: Patient) => void;
}

const ESI_STYLES: Record<number, string> = {
  1: 'bg-red-950/40 text-red-400 border-red-500/50 shadow-lg shadow-red-500/10 animate-pulse',
  2: 'bg-orange-950/30 text-orange-400 border-orange-500/40',
  3: 'bg-amber-950/30 text-amber-300 border-amber-500/40',
  4: 'bg-emerald-950/30 text-emerald-400 border-emerald-500/40',
  5: 'bg-cyan-950/30 text-cyan-400 border-cyan-500/40',
};

export const PatientCard: React.FC<PatientCardProps> = ({ patient, position, onUpdateVitals }) => {
  const isRoot = position === 1;
  const isCritical = patient.esiLevel === 1 || patient.vitalSigns.saturation < 90;

  return (
    <div className={`relative overflow-hidden rounded-xl border p-4 transition-all duration-200 bg-slate-900/90 border-slate-800/80 hover:border-cyan-500/40 ${
      isCritical ? 'border-red-500/60 bg-red-950/20' : ''
    }`}>
      {/* Indicador lateral de severidad ESI */}
      <div className={`absolute top-0 left-0 bottom-0 w-1 ${
        patient.esiLevel === 1 ? 'bg-red-500' :
        patient.esiLevel === 2 ? 'bg-orange-500' :
        patient.esiLevel === 3 ? 'bg-amber-500' : 'bg-emerald-500'
      }`} />

      <div className="pl-2 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        
        {/* Identificación y Posición en el Max-Heap */}
        <div className="flex items-center gap-3">
          <span className={`font-mono text-xs font-bold px-2 py-1 rounded border ${
            isRoot 
              ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/40 shadow-sm shadow-cyan-500/20' 
              : 'bg-slate-950 text-slate-400 border-slate-800'
          }`}>
            #{position} {isRoot && 'PRIORIDAD'}
          </span>

          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-slate-100 text-base tracking-tight">{patient.fullName}</h4>
              <span className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded-md border uppercase tracking-wider ${ESI_STYLES[patient.esiLevel]}`}>
                ESI-{patient.esiLevel}
              </span>
            </div>
            <p className="font-mono text-xs text-slate-400 mt-0.5">
              ID: {patient.id} • {patient.age} años
            </p>
          </div>
        </div>

        {/* Telemetría de Constantes Vitales (JetBrains Mono / Tabular Nums) */}
        <div className="grid grid-cols-4 gap-2 bg-slate-950 p-2 rounded-lg border border-slate-800/80 font-mono text-center text-xs tabular-nums w-full lg:w-auto">
          <div className="px-2">
            <span className="block text-[9px] text-slate-500 uppercase tracking-wider">SpO2</span>
            <span className={`font-bold ${patient.vitalSigns.saturation < 90 ? 'text-red-400' : 'text-cyan-400'}`}>
              {patient.vitalSigns.saturation}%
            </span>
          </div>
          <div className="px-2 border-l border-slate-800">
            <span className="block text-[9px] text-slate-500 uppercase tracking-wider">FC</span>
            <span className="font-bold text-emerald-400">{patient.vitalSigns.heartRate} <span className="text-[8px] text-slate-500">bpm</span></span>
          </div>
          <div className="px-2 border-l border-slate-800">
            <span className="block text-[9px] text-slate-500 uppercase tracking-wider">PA</span>
            <span className="font-bold text-slate-200">{patient.vitalSigns.systolicBP}/{patient.vitalSigns.diastolicBP}</span>
          </div>
          <div className="px-2 border-l border-slate-800">
            <span className="block text-[9px] text-slate-500 uppercase tracking-wider">Temp</span>
            <span className="font-bold text-amber-400">{patient.vitalSigns.temperature}°C</span>
          </div>
        </div>

        {/* Priority Score del Max-Heap y Acción */}
        <div className="flex items-center gap-4 w-full lg:w-auto justify-between lg:justify-end border-t lg:border-t-0 border-slate-800 pt-2 lg:pt-0">
          <div className="text-right">
            <span className="block font-mono text-[9px] text-slate-500 font-bold uppercase tracking-wider">Heap Score</span>
            <span className="font-mono text-lg font-black text-cyan-400">{patient.priorityScore}</span>
          </div>
          
          <button
            onClick={() => onUpdateVitals(patient)}
            className="bg-slate-950 hover:bg-slate-800 text-cyan-400 font-mono text-xs font-semibold px-3 py-2 rounded-lg border border-cyan-500/30 hover:border-cyan-500/60 transition"
          >
            Ajustar Signos
          </button>
        </div>
      </div>
    </div>
  );
};
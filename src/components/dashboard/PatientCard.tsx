import React from 'react';
import type { Patient } from '../../types/triage';

interface PatientCardProps {
  patient: Patient;
  position: number;
  onUpdateVitals: (patient: Patient) => void;
}

const ESI_COLORS: Record<number, string> = {
  1: 'bg-red-500/20 text-red-400 border border-red-500/40',
  2: 'bg-orange-500/20 text-orange-400 border border-orange-500/40',
  3: 'bg-amber-500/20 text-amber-300 border border-amber-500/40',
  4: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40',
  5: 'bg-sky-500/20 text-sky-400 border border-sky-500/40',
};

export const PatientCard: React.FC<PatientCardProps> = ({ patient, position, onUpdateVitals }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md hover:border-slate-700 transition flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      
      {/* Información del Paciente */}
      <div className="flex items-center gap-4">
        <span className="text-2xl font-black text-slate-500 w-8 text-center">#{position}</span>
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-slate-100 text-lg">{patient.fullName}</h4>
            <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full ${ESI_COLORS[patient.esiLevel]}`}>
              ESI {patient.esiLevel}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            ID: {patient.id} | Edad: {patient.age} años | Llegada: {new Date(patient.arrivalTime).toLocaleTimeString()}
          </p>
        </div>
      </div>

      {/* Signos Vitales (Recuadro con Fondo Oscuro y Texto Nítido) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-slate-200">
        <div><span className="text-slate-400 font-medium">FC:</span> <strong className="text-teal-400">{patient.vitalSigns.heartRate}</strong> bpm</div>
        <div><span className="text-slate-400 font-medium">SpO2:</span> <strong className="text-teal-400">{patient.vitalSigns.saturation}%</strong></div>
        <div><span className="text-slate-400 font-medium">PA:</span> <strong className="text-teal-400">{patient.vitalSigns.systolicBP}/{patient.vitalSigns.diastolicBP}</strong></div>
        <div><span className="text-slate-400 font-medium">Temp:</span> <strong className="text-teal-400">{patient.vitalSigns.temperature}°C</strong></div>
      </div>

      {/* Prioridad y Acción */}
      <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
        <div className="text-right">
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Priority Score</div>
          <div className="text-xl font-black text-indigo-400">{patient.priorityScore}</div>
        </div>
        <button
          onClick={() => onUpdateVitals(patient)}
          className="bg-slate-800 hover:bg-slate-700 text-teal-400 font-semibold text-xs px-3.5 py-2 rounded-lg border border-slate-700 transition"
        >
          Editar Signos
        </button>
      </div>
    </div>
  );
};
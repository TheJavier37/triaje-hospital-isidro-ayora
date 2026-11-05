import React, { useState, useEffect } from 'react';
import type { Patient, VitalSigns } from '../../types/triage';
import { validateVitalSigns } from '../../utils/validators';

interface VitalSignsUpdateModalProps {
  patient: Patient | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (patientId: string, vitals: VitalSigns) => void;
}

export const VitalSignsUpdateModal: React.FC<VitalSignsUpdateModalProps> = ({
  patient,
  isOpen,
  onClose,
  onUpdate,
}) => {
  const [vitals, setVitals] = useState<VitalSigns>({
    heartRate: 80,
    saturation: 98,
    systolicBP: 120,
    diastolicBP: 80,
    temperature: 36.5,
    respiratoryRate: 16,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (patient) {
      setVitals({ ...patient.vitalSigns });
      setErrors({});
    }
  }, [patient]);

  if (!isOpen || !patient) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validar rangos fisiológicos antes de procesar el reordenamiento del Max-Heap
    const validation = validateVitalSigns(vitals);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setErrors({});
    onUpdate(patient.id, vitals);
    onClose();
  };

  const handleClose = () => {
    setErrors({});
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-800 text-slate-100">
        
        {/* Encabezado del Modal */}
        <div className="flex justify-between items-center pb-3 border-b border-slate-800 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
              <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-widest">
                Heap Re-indexing
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-50 flex items-center gap-2 mt-0.5">
              <span>🩺</span> Actualizar Telemetría Paciente
            </h3>
            <p className="text-xs font-mono text-slate-400 mt-0.5">
              Paciente: <strong className="text-cyan-400 font-semibold">{patient.fullName}</strong> (ID: {patient.id})
            </p>
          </div>
          <button
            onClick={handleClose}
            type="button"
            className="text-slate-400 hover:text-slate-100 font-bold p-1 rounded-lg hover:bg-slate-800 transition"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Frecuencia Cardíaca & SpO2 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Frecuencia Cardíaca (bpm)
              </label>
              <input
                type="number"
                value={vitals.heartRate}
                onChange={(e) => setVitals({ ...vitals, heartRate: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm font-mono text-slate-100 focus:border-cyan-500 outline-none transition"
              />
              {errors.heartRate && <span className="text-red-400 text-[10px] font-mono mt-1 block">{errors.heartRate}</span>}
            </div>

            <div>
              <label className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Saturación SpO2 (%)
              </label>
              <input
                type="number"
                value={vitals.saturation}
                onChange={(e) => setVitals({ ...vitals, saturation: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm font-mono text-slate-100 focus:border-cyan-500 outline-none transition"
              />
              {errors.saturation && <span className="text-red-400 text-[10px] font-mono mt-1 block">{errors.saturation}</span>}
            </div>
          </div>

          {/* Presiones Arteriales */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Presión Sistólica (PAS)
              </label>
              <input
                type="number"
                value={vitals.systolicBP}
                onChange={(e) => setVitals({ ...vitals, systolicBP: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm font-mono text-slate-100 focus:border-cyan-500 outline-none transition"
              />
              {errors.systolicBP && <span className="text-red-400 text-[10px] font-mono mt-1 block">{errors.systolicBP}</span>}
            </div>

            <div>
              <label className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Presión Diastólica (PAD)
              </label>
              <input
                type="number"
                value={vitals.diastolicBP}
                onChange={(e) => setVitals({ ...vitals, diastolicBP: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm font-mono text-slate-100 focus:border-cyan-500 outline-none transition"
              />
              {errors.diastolicBP && <span className="text-red-400 text-[10px] font-mono mt-1 block">{errors.diastolicBP}</span>}
            </div>
          </div>

          {/* Temperatura & Frecuencia Respiratoria */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Temperatura (°C)
              </label>
              <input
                type="number"
                step="0.1"
                value={vitals.temperature}
                onChange={(e) => setVitals({ ...vitals, temperature: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm font-mono text-slate-100 focus:border-cyan-500 outline-none transition"
              />
              {errors.temperature && <span className="text-red-400 text-[10px] font-mono mt-1 block">{errors.temperature}</span>}
            </div>

            <div>
              <label className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Frecuencia Resp. (rpm)
              </label>
              <input
                type="number"
                value={vitals.respiratoryRate}
                onChange={(e) => setVitals({ ...vitals, respiratoryRate: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm font-mono text-slate-100 focus:border-cyan-500 outline-none transition"
              />
              {errors.respiratoryRate && <span className="text-red-400 text-[10px] font-mono mt-1 block">{errors.respiratoryRate}</span>}
            </div>
          </div>

          {/* Acciones de Guardado y Re-evaluación */}
          <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2.5 rounded-xl text-xs font-mono font-semibold text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono font-bold text-xs uppercase tracking-wider px-5 py-2.5 rounded-xl transition shadow-lg shadow-cyan-500/20 active:scale-95 flex items-center gap-1.5"
            >
              <span>⚡</span> Re-evaluar Prioridad (Heapify)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
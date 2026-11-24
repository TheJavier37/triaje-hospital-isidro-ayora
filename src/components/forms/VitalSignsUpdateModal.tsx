import React, { useState, useEffect, useCallback } from 'react';
import type { Patient, VitalSigns } from '../../types/triage';
import { validateVitalSigns } from '../../utils/validators';

/**
 * Propiedades recibidas por el componente VitalSignsUpdateModal desde App.tsx.
 */
interface VitalSignsUpdateModalProps {
  /** Paciente seleccionado cuya telemetría será modificada; null cuando no hay selección activa. */
  patient: Patient | null;
  /** Controla la visibilidad del modal de actualización en pantalla. */
  isOpen: boolean;
  /** Evento disparado al cancelar, hacer clic fuera del modal o presionar la tecla Escape. */
  onClose: () => void;
  /** Evento disparado al guardar signos vitales válidos para recalcular la prioridad y ejecutar Heapify en App.tsx. */
  onUpdate: (patientId: string, vitals: VitalSigns) => void;
}

/**
 * Modal accesible para actualizar en tiempo real las constantes vitales de un paciente
 * en cola y disparar el reordenamiento dinámico (Heapify) según su evolución clínica.
 */
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

  const handleClose = useCallback(() => {
    setErrors({});
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (patient) {
      setVitals({ ...patient.vitalSigns });
      setErrors({});
    }
  }, [patient]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose]);

  if (!isOpen || !patient) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const validation = validateVitalSigns(vitals);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setErrors({});
    onUpdate(patient.id, vitals);
    onClose();
  };

  const inputClass =
    'w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-sm font-mono text-slate-100 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/50 focus:outline-none transition';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-vitals-title"
      onClick={handleClose}
      className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex justify-center items-center z-50 p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-900 rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-700/80 max-h-[90vh] overflow-y-auto text-slate-100"
      >
        {/* Encabezado del Modal */}
        <div className="flex justify-between items-start gap-3 pb-3 border-b border-slate-800 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" aria-hidden="true" />
              <span className="text-[11px] font-mono font-bold text-cyan-300 uppercase tracking-widest">
                Heap Re-indexing
              </span>
            </div>
            <h3 id="modal-vitals-title" className="text-lg font-bold text-slate-50 flex items-center gap-2 mt-0.5">
              <span aria-hidden="true">🩺</span> Actualizar Telemetría Paciente
            </h3>
            <p className="text-xs font-mono text-slate-300 mt-1">
              Paciente: <strong className="text-cyan-300 font-semibold">{patient.fullName}</strong> (ID: {patient.id})
            </p>
          </div>
          <button
            onClick={handleClose}
            type="button"
            aria-label="Cerrar modal de actualización de signos vitales"
            className="text-slate-300 hover:text-slate-50 font-bold p-2 rounded-lg hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-400 transition shrink-0 cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Frecuencia Cardíaca & SpO2 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="upd-hr" className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider block mb-1">
                Frecuencia Cardíaca (bpm)
              </label>
              <input
                id="upd-hr"
                type="number"
                autoFocus
                value={vitals.heartRate}
                onChange={(e) => setVitals({ ...vitals, heartRate: Number(e.target.value) })}
                className={inputClass}
              />
              {errors.heartRate && <span className="text-red-400 text-[11px] font-mono mt-1 block">{errors.heartRate}</span>}
            </div>

            <div>
              <label htmlFor="upd-spo2" className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider block mb-1">
                Saturación SpO2 (%)
              </label>
              <input
                id="upd-spo2"
                type="number"
                value={vitals.saturation}
                onChange={(e) => setVitals({ ...vitals, saturation: Number(e.target.value) })}
                className={inputClass}
              />
              {errors.saturation && <span className="text-red-400 text-[11px] font-mono mt-1 block">{errors.saturation}</span>}
            </div>
          </div>

          {/* Presiones Arteriales */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="upd-pas" className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider block mb-1">
                Presión Sistólica (PAS)
              </label>
              <input
                id="upd-pas"
                type="number"
                value={vitals.systolicBP}
                onChange={(e) => setVitals({ ...vitals, systolicBP: Number(e.target.value) })}
                className={inputClass}
              />
              {errors.systolicBP && <span className="text-red-400 text-[11px] font-mono mt-1 block">{errors.systolicBP}</span>}
            </div>

            <div>
              <label htmlFor="upd-pad" className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider block mb-1">
                Presión Diastólica (PAD)
              </label>
              <input
                id="upd-pad"
                type="number"
                value={vitals.diastolicBP}
                onChange={(e) => setVitals({ ...vitals, diastolicBP: Number(e.target.value) })}
                className={inputClass}
              />
              {errors.diastolicBP && <span className="text-red-400 text-[11px] font-mono mt-1 block">{errors.diastolicBP}</span>}
            </div>
          </div>

          {/* Temperatura & Frecuencia Respiratoria */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="upd-temp" className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider block mb-1">
                Temperatura (°C)
              </label>
              <input
                id="upd-temp"
                type="number"
                step="0.1"
                value={vitals.temperature}
                onChange={(e) => setVitals({ ...vitals, temperature: Number(e.target.value) })}
                className={inputClass}
              />
              {errors.temperature && <span className="text-red-400 text-[11px] font-mono mt-1 block">{errors.temperature}</span>}
            </div>

            <div>
              <label htmlFor="upd-fr" className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider block mb-1">
                Frecuencia Resp. (rpm)
              </label>
              <input
                id="upd-fr"
                type="number"
                value={vitals.respiratoryRate}
                onChange={(e) => setVitals({ ...vitals, respiratoryRate: Number(e.target.value) })}
                className={inputClass}
              />
              {errors.respiratoryRate && <span className="text-red-400 text-[11px] font-mono mt-1 block">{errors.respiratoryRate}</span>}
            </div>
          </div>

          {/* Acciones de Guardado y Re-evaluación */}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2.5 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={handleClose}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-mono font-semibold text-slate-300 hover:text-slate-50 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="w-full sm:w-auto bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono font-bold text-xs uppercase tracking-wider px-5 py-2.5 rounded-xl transition shadow-lg shadow-cyan-500/20 active:scale-95 focus:outline-none focus:ring-2 focus:ring-cyan-300 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span aria-hidden="true">⚡</span> Re-evaluar Prioridad (Heapify)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
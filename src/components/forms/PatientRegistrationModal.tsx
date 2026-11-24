import React, { useState, useEffect, useCallback } from 'react';
import type { EsiLevel, VitalSigns } from '../../types/triage';
import { validatePatientData, type PatientFormErrors } from '../../utils/validators';

/**
 * Propiedades recibidas por el componente PatientRegistrationModal desde App.tsx.
 */
interface PatientRegistrationModalProps {
  /** Controla la visibilidad del modal de registro en pantalla. */
  isOpen: boolean;
  /** Evento disparado al cancelar, hacer clic fuera del cuadro o presionar la tecla Escape. */
  onClose: () => void;
  /** Evento disparado al enviar el formulario válido para insertar el nuevo paciente en el Max-Heap de App.tsx. */
  onRegister: (
    fullName: string,
    age: number,
    esiLevel: EsiLevel,
    vitalSigns: VitalSigns,
    id: string
  ) => void;
}

/**
 * Modal accesible para el ingreso de nuevos pacientes al sistema de triaje.
 * Soporta cierre mediante tecla Escape o clic en el fondo, enfoque claro en controles
 * y validación clínica de constantes vitales antes de la inserción.
 */
export const PatientRegistrationModal: React.FC<PatientRegistrationModalProps> = ({
  isOpen,
  onClose,
  onRegister,
}) => {
  const [fullName, setFullName] = useState('');
  const [id, setId] = useState('');
  const [age, setAge] = useState<number | ''>(30);
  const [esiLevel, setEsiLevel] = useState<EsiLevel>(3);
  const [errors, setErrors] = useState<PatientFormErrors>({});

  const [vitals, setVitals] = useState<VitalSigns>({
    heartRate: 80,
    saturation: 98,
    systolicBP: 120,
    diastolicBP: 80,
    temperature: 36.5,
    respiratoryRate: 16,
  });

  const handleClose = useCallback(() => {
    setErrors({});
    onClose();
  }, [onClose]);

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

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numericAge = typeof age === 'number' ? age : 0;
    const finalId = id.trim() === '' ? `NN-${Date.now().toString().slice(-6)}` : id.trim();

    const validationErrors = validatePatientData({
      fullName: fullName.trim(),
      id: id.trim(),
      age: numericAge,
      vitalSigns: vitals,
    });

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    onRegister(fullName.trim(), numericAge, esiLevel, vitals, finalId);
    setFullName('');
    setId('');
    setAge(30);
    setEsiLevel(3);
    setVitals({
      heartRate: 80,
      saturation: 98,
      systolicBP: 120,
      diastolicBP: 80,
      temperature: 36.5,
      respiratoryRate: 16,
    });
    onClose();
  };

  const inputBaseClass =
    'w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-sm text-slate-100 placeholder-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/50 focus:outline-none transition';

  const vitalInputClass =
    'w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm font-mono text-slate-100 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/50 focus:outline-none transition';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-register-title"
      onClick={handleClose}
      className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex justify-center items-center z-50 p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-900 rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-700/80 max-h-[90vh] overflow-y-auto text-slate-100"
      >
        {/* Encabezado del Modal */}
        <div className="flex justify-between items-center pb-4 border-b border-slate-800 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" aria-hidden="true" />
              <span className="text-[11px] font-mono font-bold text-cyan-300 uppercase tracking-widest">
                Max-Heap Ingestion
              </span>
            </div>
            <h3 id="modal-register-title" className="text-xl font-extrabold text-slate-50 tracking-tight mt-0.5">
              Ingreso de Nuevo Paciente
            </h3>
          </div>
          <button
            onClick={handleClose}
            type="button"
            aria-label="Cerrar modal de registro de paciente"
            className="text-slate-300 hover:text-slate-50 font-bold p-2 rounded-lg hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-400 transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nombre Completo */}
          <div>
            <label htmlFor="patient-fullname" className="block text-xs font-mono font-bold text-slate-300 uppercase tracking-wider mb-1">
              Nombre Completo *
            </label>
            <input
              id="patient-fullname"
              type="text"
              autoFocus
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className={inputBaseClass}
              placeholder="Ej: Juan Pérez"
            />
            {errors.fullName && <span className="text-red-400 font-mono text-xs mt-1 block">{errors.fullName}</span>}
          </div>

          {/* Cédula y Edad */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="patient-id" className="block text-xs font-mono font-bold text-slate-300 uppercase tracking-wider mb-1">
                Cédula / ID <span className="text-[11px] font-sans text-slate-400 lowercase">(opcional)</span>
              </label>
              <input
                id="patient-id"
                type="text"
                value={id}
                onChange={(e) => setId(e.target.value)}
                className={`${inputBaseClass} font-mono`}
                placeholder="110XXXXXXX o vacío (NN)"
              />
              {errors.id && <span className="text-red-400 font-mono text-xs mt-1 block">{errors.id}</span>}
            </div>

            <div>
              <label htmlFor="patient-age" className="block text-xs font-mono font-bold text-slate-300 uppercase tracking-wider mb-1">
                Edad *
              </label>
              <input
                id="patient-age"
                type="number"
                min={0}
                max={120}
                value={age}
                onChange={(e) => setAge(e.target.value === '' ? '' : Number(e.target.value))}
                className={`${inputBaseClass} font-mono`}
              />
              {errors.age && <span className="text-red-400 font-mono text-xs mt-1 block">{errors.age}</span>}
            </div>
          </div>

          {/* Nivel ESI */}
          <div>
            <label htmlFor="patient-esi" className="block text-xs font-mono font-bold text-slate-300 uppercase tracking-wider mb-1">
              Nivel ESI Base
            </label>
            <select
              id="patient-esi"
              value={esiLevel}
              onChange={(e) => setEsiLevel(Number(e.target.value) as EsiLevel)}
              className={`${inputBaseClass} font-mono`}
            >
              <option value={1}>ESI 1 - Resucitación (Crítico)</option>
              <option value={2}>ESI 2 - Emergencia / Muy Urgente</option>
              <option value={3}>ESI 3 - Urgente</option>
              <option value={4}>ESI 4 - Menor / Poco Urgente</option>
              <option value={5}>ESI 5 - No Urgente</option>
            </select>
          </div>

          {/* Signos Vitales */}
          <div className="border-t border-slate-800 pt-4">
            <h4 className="text-xs font-mono font-bold text-cyan-300 uppercase tracking-wider mb-3">
              Signos Vitales Iniciales (Telemetría)
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label htmlFor="reg-hr" className="text-xs font-mono text-slate-300 font-semibold block mb-1">
                  F.C. (bpm)
                </label>
                <input
                  id="reg-hr"
                  type="number"
                  value={vitals.heartRate}
                  onChange={(e) => setVitals({ ...vitals, heartRate: Number(e.target.value) })}
                  className={vitalInputClass}
                />
                {errors.heartRate && <span className="text-red-400 text-[11px] font-mono mt-0.5 block">{errors.heartRate}</span>}
              </div>

              <div>
                <label htmlFor="reg-spo2" className="text-xs font-mono text-slate-300 font-semibold block mb-1">
                  SpO2 (%)
                </label>
                <input
                  id="reg-spo2"
                  type="number"
                  value={vitals.saturation}
                  onChange={(e) => setVitals({ ...vitals, saturation: Number(e.target.value) })}
                  className={vitalInputClass}
                />
                {errors.saturation && <span className="text-red-400 text-[11px] font-mono mt-0.5 block">{errors.saturation}</span>}
              </div>

              <div>
                <label htmlFor="reg-temp" className="text-xs font-mono text-slate-300 font-semibold block mb-1">
                  Temp (°C)
                </label>
                <input
                  id="reg-temp"
                  type="number"
                  step="0.1"
                  value={vitals.temperature}
                  onChange={(e) => setVitals({ ...vitals, temperature: Number(e.target.value) })}
                  className={vitalInputClass}
                />
                {errors.temperature && <span className="text-red-400 text-[11px] font-mono mt-0.5 block">{errors.temperature}</span>}
              </div>

              <div>
                <label htmlFor="reg-pas" className="text-xs font-mono text-slate-300 font-semibold block mb-1">
                  PAS (mmHg)
                </label>
                <input
                  id="reg-pas"
                  type="number"
                  value={vitals.systolicBP}
                  onChange={(e) => setVitals({ ...vitals, systolicBP: Number(e.target.value) })}
                  className={vitalInputClass}
                />
                {errors.systolicBP && <span className="text-red-400 text-[11px] font-mono mt-0.5 block">{errors.systolicBP}</span>}
              </div>

              <div>
                <label htmlFor="reg-pad" className="text-xs font-mono text-slate-300 font-semibold block mb-1">
                  PAD (mmHg)
                </label>
                <input
                  id="reg-pad"
                  type="number"
                  value={vitals.diastolicBP}
                  onChange={(e) => setVitals({ ...vitals, diastolicBP: Number(e.target.value) })}
                  className={vitalInputClass}
                />
                {errors.diastolicBP && <span className="text-red-400 text-[11px] font-mono mt-0.5 block">{errors.diastolicBP}</span>}
              </div>

              <div>
                <label htmlFor="reg-fr" className="text-xs font-mono text-slate-300 font-semibold block mb-1">
                  F.R. (rpm)
                </label>
                <input
                  id="reg-fr"
                  type="number"
                  value={vitals.respiratoryRate}
                  onChange={(e) => setVitals({ ...vitals, respiratoryRate: Number(e.target.value) })}
                  className={vitalInputClass}
                />
                {errors.respiratoryRate && <span className="text-red-400 text-[11px] font-mono mt-0.5 block">{errors.respiratoryRate}</span>}
              </div>
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={handleClose}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-mono font-semibold text-slate-300 hover:text-slate-50 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="w-full sm:w-auto bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono font-bold text-xs uppercase tracking-wider px-5 py-2.5 rounded-xl transition shadow-lg shadow-cyan-500/20 active:scale-95 focus:outline-none focus:ring-2 focus:ring-cyan-300 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>+</span>
              <span>Registrar Paciente</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
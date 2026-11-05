// src/components/forms/PatientRegistrationModal.tsx

import React, { useState } from 'react';
import type { EsiLevel, VitalSigns } from '../../types/triage';
import { validatePatientData, type PatientFormErrors } from '../../utils/validators';

interface PatientRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegister: (
    fullName: string,
    age: number,
    esiLevel: EsiLevel,
    vitalSigns: VitalSigns,
    id: string
  ) => void;
}

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

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numericAge = typeof age === 'number' ? age : 0;
    const finalId = id.trim() === '' ? `NN-${Date.now().toString().slice(-6)}` : id.trim();

    // Ejecución del validador
    const validationErrors = validatePatientData({
      fullName: fullName.trim(),
      id: id.trim(),
      age: numericAge,
      vitalSigns: vitals,
    });

    // Si existen errores, se guardan en el estado y se detiene el envío
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    // Registro exitoso y reseteo de formulario
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

  const handleClose = () => {
    setErrors({});
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-800 max-h-[90vh] overflow-y-auto text-slate-100">
        
        {/* Encabezado */}
        <div className="flex justify-between items-center pb-4 border-b border-slate-800 mb-4">
          <div>
            <h3 className="text-xl font-bold text-slate-50">Ingreso de Nuevo Paciente</h3>
            <p className="text-xs text-slate-400 mt-0.5">Triaje Automatizado - Hospital Isidro Ayora</p>
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
          {/* Nombre Completo */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Nombre Completo *
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-slate-100 placeholder-slate-600 focus:border-teal-500 outline-none transition"
              placeholder="Ej: Juan Pérez"
            />
            {errors.fullName && <span className="text-red-400 text-xs mt-1 block">{errors.fullName}</span>}
          </div>

          {/* Cédula y Edad */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Cédula / ID <span className="text-[10px] text-slate-500 lowercase">(opcional)</span>
              </label>
              <input
                type="text"
                value={id}
                onChange={(e) => setId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-slate-100 placeholder-slate-600 focus:border-teal-500 outline-none transition"
                placeholder="110XXXXXXX o vacio (NN)"
              />
              {errors.id && <span className="text-red-400 text-xs mt-1 block">{errors.id}</span>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Edad *
              </label>
              <input
                type="number"
                min={0}
                max={120}
                value={age}
                onChange={(e) => setAge(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-slate-100 focus:border-teal-500 outline-none transition"
              />
              {errors.age && <span className="text-red-400 text-xs mt-1 block">{errors.age}</span>}
            </div>
          </div>

          {/* Nivel ESI */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Nivel ESI Base
            </label>
            <select
              value={esiLevel}
              onChange={(e) => setEsiLevel(Number(e.target.value) as EsiLevel)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-slate-100 focus:border-teal-500 outline-none transition"
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
            <h4 className="text-xs font-bold text-teal-400 uppercase tracking-wider mb-3">
              Signos Vitales Iniciales
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] text-slate-400 font-semibold block mb-1">F.C. (bpm)</label>
                <input
                  type="number"
                  value={vitals.heartRate}
                  onChange={(e) => setVitals({ ...vitals, heartRate: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-slate-100 focus:border-teal-500 outline-none"
                />
                {errors.heartRate && <span className="text-red-400 text-[10px] mt-0.5 block">{errors.heartRate}</span>}
              </div>

              <div>
                <label className="text-[11px] text-slate-400 font-semibold block mb-1">SpO2 (%)</label>
                <input
                  type="number"
                  value={vitals.saturation}
                  onChange={(e) => setVitals({ ...vitals, saturation: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-slate-100 focus:border-teal-500 outline-none"
                />
                {errors.saturation && <span className="text-red-400 text-[10px] mt-0.5 block">{errors.saturation}</span>}
              </div>

              <div>
                <label className="text-[11px] text-slate-400 font-semibold block mb-1">Temp (°C)</label>
                <input
                  type="number"
                  step="0.1"
                  value={vitals.temperature}
                  onChange={(e) => setVitals({ ...vitals, temperature: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-slate-100 focus:border-teal-500 outline-none"
                />
                {errors.temperature && <span className="text-red-400 text-[10px] mt-0.5 block">{errors.temperature}</span>}
              </div>

              <div>
                <label className="text-[11px] text-slate-400 font-semibold block mb-1">PAS (mmHg)</label>
                <input
                  type="number"
                  value={vitals.systolicBP}
                  onChange={(e) => setVitals({ ...vitals, systolicBP: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-slate-100 focus:border-teal-500 outline-none"
                />
                {errors.systolicBP && <span className="text-red-400 text-[10px] mt-0.5 block">{errors.systolicBP}</span>}
              </div>

              <div>
                <label className="text-[11px] text-slate-400 font-semibold block mb-1">PAD (mmHg)</label>
                <input
                  type="number"
                  value={vitals.diastolicBP}
                  onChange={(e) => setVitals({ ...vitals, diastolicBP: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-slate-100 focus:border-teal-500 outline-none"
                />
                {errors.diastolicBP && <span className="text-red-400 text-[10px] mt-0.5 block">{errors.diastolicBP}</span>}
              </div>

              <div>
                <label className="text-[11px] text-slate-400 font-semibold block mb-1">F.R. (rpm)</label>
                <input
                  type="number"
                  value={vitals.respiratoryRate}
                  onChange={(e) => setVitals({ ...vitals, respiratoryRate: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-slate-100 focus:border-teal-500 outline-none"
                />
                {errors.respiratoryRate && <span className="text-red-400 text-[10px] mt-0.5 block">{errors.respiratoryRate}</span>}
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs px-5 py-2.5 rounded-xl transition shadow-lg shadow-teal-500/20 active:scale-95 flex items-center gap-2"
            >
              <span>+</span> Registrar Paciente
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
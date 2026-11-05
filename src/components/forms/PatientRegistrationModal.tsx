// Author: TheJavier37

import React, { useState } from 'react';
import type { EsiLevel, VitalSigns } from '../../types/triage';
import { VitalSignsFields } from './VitalSignsFields';
import type { VitalSignsText } from './VitalSignsFields';
import {
  AGE_LIMIT,
  VITAL_SIGN_KEYS,
  parseNumericInput,
  validatePatientData,
} from '../../utils/vitalSignsValidation';
import type { FormErrors, ValidationResult, VitalSignKey } from '../../utils/vitalSignsValidation';

interface PatientRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegister: (
    fullName: string,
    age: number,
    esiLevel: EsiLevel,
    vitalSigns: VitalSigns,
    id: string
  ) => ValidationResult;
}

const DEFAULT_VITALS: VitalSignsText = {
  heartRate: '80',
  saturation: '98',
  systolicBP: '120',
  diastolicBP: '80',
  temperature: '36.5',
  respiratoryRate: '16',
};

const inputClass = (hasError: boolean) =>
  `w-full border rounded-lg p-2.5 text-sm focus:ring-2 outline-none ${
    hasError ? 'border-red-500 focus:ring-red-400' : 'border-gray-300 focus:ring-indigo-500'
  }`;

export const PatientRegistrationModal: React.FC<PatientRegistrationModalProps> = ({
  isOpen,
  onClose,
  onRegister,
}) => {
  const [fullName, setFullName] = useState('');
  const [id, setId] = useState('');
  const [age, setAge] = useState('30');
  const [esiLevel, setEsiLevel] = useState<EsiLevel>(3);
  const [vitals, setVitals] = useState<VitalSignsText>(DEFAULT_VITALS);
  const [errors, setErrors] = useState<FormErrors>({});

  if (!isOpen) return null;

  const clearError = (field: keyof FormErrors) => setErrors((prev) => ({ ...prev, [field]: undefined }));

  const handleVitalChange = (key: VitalSignKey, value: string) => {
    setVitals((prev) => ({ ...prev, [key]: value }));
    clearError(key);
  };

  const resetForm = () => {
    setFullName('');
    setId('');
    setAge('30');
    setEsiLevel(3);
    setVitals(DEFAULT_VITALS);
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const vitalSigns = Object.fromEntries(
      VITAL_SIGN_KEYS.map((key) => [key, parseNumericInput(vitals[key])])
    ) as unknown as VitalSigns;
    const numericAge = parseNumericInput(age);

    const validation = validatePatientData({ fullName, id, age: numericAge, esiLevel, vitalSigns });
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    // El hook vuelve a validar (y detecta, por ejemplo, una cédula repetida en la cola).
    const result = onRegister(fullName.trim(), numericAge, esiLevel, vitalSigns, id.trim());
    if (!result.isValid) {
      setErrors(result.errors);
      return;
    }

    handleClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Ingreso de Nuevo Paciente</h3>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Nombre Completo</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => { setFullName(e.target.value); clearError('fullName'); }}
              className={inputClass(!!errors.fullName)}
              placeholder="Ej: Juan Pérez"
              aria-invalid={!!errors.fullName}
            />
            {errors.fullName && <p className="text-[11px] text-red-600 mt-1">{errors.fullName}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Cédula / ID</label>
              <input
                type="text"
                value={id}
                onChange={(e) => { setId(e.target.value); clearError('id'); }}
                className={inputClass(!!errors.id)}
                placeholder="110XXXXXXX"
                aria-invalid={!!errors.id}
              />
              {errors.id && <p className="text-[11px] text-red-600 mt-1">{errors.id}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Edad</label>
              <input
                type="number"
                inputMode="numeric"
                min={AGE_LIMIT.min}
                max={AGE_LIMIT.max}
                step={1}
                value={age}
                onKeyDown={(e) => {
                  if (['-', '+', 'e', 'E', '.'].includes(e.key)) e.preventDefault();
                }}
                onChange={(e) => { setAge(e.target.value); clearError('age'); }}
                className={inputClass(!!errors.age)}
                aria-invalid={!!errors.age}
              />
              {errors.age && <p className="text-[11px] text-red-600 mt-1">{errors.age}</p>}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Nivel ESI Base</label>
            <select
              value={esiLevel}
              onChange={(e) => setEsiLevel(Number(e.target.value) as EsiLevel)}
              className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value={1}>ESI 1 - Resucitación (Crítico)</option>
              <option value={2}>ESI 2 - Emergencia / Muy Urgente</option>
              <option value={3}>ESI 3 - Urgente</option>
              <option value={4}>ESI 4 - Menor / Poco Urgente</option>
              <option value={5}>ESI 5 - No Urgente</option>
            </select>
          </div>

          <div className="border-t pt-3">
            <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Signos Vitales Iniciales</h4>
            <VitalSignsFields values={vitals} errors={errors} onChange={handleVitalChange} />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-100 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition shadow"
            >
              Registrar Paciente
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

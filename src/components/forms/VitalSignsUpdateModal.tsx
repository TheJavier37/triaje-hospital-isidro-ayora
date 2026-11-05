// Author: TheJavier37

import React, { useState } from 'react';
import type { Patient, VitalSigns } from '../../types/triage';
import { VitalSignsFields } from './VitalSignsFields';
import type { VitalSignsText } from './VitalSignsFields';
import {
  VITAL_SIGN_KEYS,
  parseNumericInput,
  validateVitalSigns,
} from '../../utils/vitalSignsValidation';
import type { FormErrors, ValidationResult, VitalSignKey } from '../../utils/vitalSignsValidation';

interface VitalSignsUpdateModalProps {
  patient: Patient | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (patientId: string, vitals: VitalSigns) => ValidationResult;
}

const toText = (vitals: VitalSigns): VitalSignsText =>
  Object.fromEntries(VITAL_SIGN_KEYS.map((key) => [key, String(vitals[key])])) as VitalSignsText;

const toNumbers = (text: VitalSignsText): VitalSigns =>
  Object.fromEntries(VITAL_SIGN_KEYS.map((key) => [key, parseNumericInput(text[key])])) as unknown as VitalSigns;

// Formulario interno: se vuelve a crear (con los valores del paciente) cada vez que cambia el paciente
// o su última actualización, gracias a la prop `key` del contenedor.
const UpdateForm: React.FC<{
  patient: Patient;
  onClose: () => void;
  onUpdate: VitalSignsUpdateModalProps['onUpdate'];
}> = ({ patient, onClose, onUpdate }) => {
  const [values, setValues] = useState<VitalSignsText>(() => toText(patient.vitalSigns));
  const [errors, setErrors] = useState<FormErrors>({});

  const handleChange = (key: VitalSignKey, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    // El error de un campo se limpia al editarlo.
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const vitals = toNumbers(values);
    const validation = validateVitalSigns(vitals);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    const result = onUpdate(patient.id, vitals);
    if (!result.isValid) {
      setErrors(result.errors);
      return;
    }
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-3">
      <VitalSignsFields values={values} errors={errors} onChange={handleChange} />

      {errors.id && <p className="text-xs text-red-600">{errors.id}</p>}

      <div className="flex justify-end gap-2 pt-4 border-t">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-100 transition"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-4 py-2 rounded-lg text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition shadow"
        >
          Re-evaluar Prioridad (Heapify)
        </button>
      </div>
    </form>
  );
};

export const VitalSignsUpdateModal: React.FC<VitalSignsUpdateModalProps> = ({
  patient,
  isOpen,
  onClose,
  onUpdate,
}) => {
  if (!isOpen || !patient) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-bold text-gray-800">Actualizar Signos Vitales</h3>
        <p className="text-xs text-gray-500 mb-4">Paciente: <strong>{patient.fullName}</strong></p>

        <UpdateForm
          key={`${patient.id}-${patient.lastUpdated.getTime()}`}
          patient={patient}
          onClose={onClose}
          onUpdate={onUpdate}
        />
      </div>
    </div>
  );
};

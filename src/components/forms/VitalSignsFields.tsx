// Campos de signos vitales reutilizados por el ingreso y la edición de pacientes.
// Los valores se manejan como texto: así un campo vacío se detecta y no se confunde con 0.

import React from 'react';
import type { FormErrors, VitalSignKey } from '../../utils/vitalSignsValidation';
import { VITAL_SIGN_LIMITS } from '../../utils/vitalSignsValidation';

export type VitalSignsText = Record<VitalSignKey, string>;

const FIELD_LABELS: Record<VitalSignKey, string> = {
  heartRate: 'Frecuencia Cardíaca (bpm)',
  saturation: 'Saturación SpO2 (%)',
  systolicBP: 'Presión Sistólica (mmHg)',
  diastolicBP: 'Presión Diastólica (mmHg)',
  temperature: 'Temperatura (°C)',
  respiratoryRate: 'Frecuencia Resp. (rpm)',
};

const FIELD_ORDER: VitalSignKey[] = [
  'heartRate',
  'saturation',
  'systolicBP',
  'diastolicBP',
  'temperature',
  'respiratoryRate',
];

// Teclas que no se permiten en los campos numéricos: así no se pueden escribir negativos ni notación científica.
const BLOCKED_KEYS = ['-', '+', 'e', 'E'];

interface VitalSignsFieldsProps {
  values: VitalSignsText;
  errors: FormErrors;
  onChange: (key: VitalSignKey, value: string) => void;
}

export const VitalSignsFields: React.FC<VitalSignsFieldsProps> = ({ values, errors, onChange }) => (
  <div className="grid grid-cols-2 gap-3">
    {FIELD_ORDER.map((key) => {
      const limit = VITAL_SIGN_LIMITS[key];
      const error = errors[key];

      return (
        <div key={key}>
          <label htmlFor={`vital-${key}`} className="text-xs font-semibold text-gray-600 block mb-1">
            {FIELD_LABELS[key]}
          </label>
          <input
            id={`vital-${key}`}
            type="number"
            inputMode={limit.decimals === 1 ? 'decimal' : 'numeric'}
            min={limit.min}
            max={limit.max}
            step={limit.decimals === 1 ? 0.1 : 1}
            value={values[key]}
            onKeyDown={(e) => {
              if (BLOCKED_KEYS.includes(e.key)) e.preventDefault();
            }}
            onChange={(e) => onChange(key, e.target.value)}
            aria-invalid={!!error}
            aria-describedby={error ? `vital-${key}-error` : undefined}
            className={`w-full border rounded-lg p-2 text-sm focus:ring-2 outline-none ${
              error ? 'border-red-500 focus:ring-red-400' : 'border-gray-300 focus:ring-indigo-500'
            }`}
          />
          {error && (
            <p id={`vital-${key}-error`} className="text-[11px] text-red-600 mt-1">
              {error}
            </p>
          )}
        </div>
      );
    })}
  </div>
);

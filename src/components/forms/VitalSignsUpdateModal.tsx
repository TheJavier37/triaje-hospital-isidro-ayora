// Author: TheJavier37

import React, { useState, useEffect } from 'react';
import type { Patient, VitalSigns } from '../../types/triage';

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

  useEffect(() => {
    if (patient) {
      setVitals({ ...patient.vitalSigns });
    }
  }, [patient]);

  if (!isOpen || !patient) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(patient.id, vitals);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100">
        <h3 className="text-lg font-bold text-gray-800">Actualizar Signos Vitales</h3>
        <p className="text-xs text-gray-500 mb-4">Paciente: <strong>{patient.fullName}</strong></p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Frecuencia Cardíaca (bpm)</label>
              <input
                type="number"
                value={vitals.heartRate}
                onChange={(e) => setVitals({ ...vitals, heartRate: Number(e.target.value) })}
                className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Saturación SpO2 (%)</label>
              <input
                type="number"
                value={vitals.saturation}
                onChange={(e) => setVitals({ ...vitals, saturation: Number(e.target.value) })}
                className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Presión Sistólica</label>
              <input
                type="number"
                value={vitals.systolicBP}
                onChange={(e) => setVitals({ ...vitals, systolicBP: Number(e.target.value) })}
                className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Presión Diastólica</label>
              <input
                type="number"
                value={vitals.diastolicBP}
                onChange={(e) => setVitals({ ...vitals, diastolicBP: Number(e.target.value) })}
                className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Temperatura (°C)</label>
              <input
                type="number"
                step="0.1"
                value={vitals.temperature}
                onChange={(e) => setVitals({ ...vitals, temperature: Number(e.target.value) })}
                className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Frecuencia Resp. (rpm)</label>
              <input
                type="number"
                value={vitals.respiratoryRate}
                onChange={(e) => setVitals({ ...vitals, respiratoryRate: Number(e.target.value) })}
                className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>

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
      </div>
    </div>
  );
};
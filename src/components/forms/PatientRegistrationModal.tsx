// Author: TheJavier37

import React, { useState } from 'react';
import type { EsiLevel, VitalSigns } from '../../types/triage';

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
  const [age, setAge] = useState(30);
  const [esiLevel, setEsiLevel] = useState<EsiLevel>(3);

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
    if (!fullName || !id) return;

    onRegister(fullName, Number(age), esiLevel, vitals, id);
    onClose();
    setFullName('');
    setId('');
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Ingreso de Nuevo Paciente</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Nombre Completo</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="Ej: Juan Pérez"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Cédula / ID</label>
              <input
                type="text"
                required
                value={id}
                onChange={(e) => setId(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="110XXXXXXX"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Edad</label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
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
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] text-gray-500 font-bold block">F.C. (bpm)</label>
                <input
                  type="number"
                  value={vitals.heartRate}
                  onChange={(e) => setVitals({ ...vitals, heartRate: Number(e.target.value) })}
                  className="w-full border rounded p-1 text-sm"
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-500 font-bold block">SpO2 (%)</label>
                <input
                  type="number"
                  value={vitals.saturation}
                  onChange={(e) => setVitals({ ...vitals, saturation: Number(e.target.value) })}
                  className="w-full border rounded p-1 text-sm"
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-500 font-bold block">Temp (°C)</label>
                <input
                  type="number"
                  step="0.1"
                  value={vitals.temperature}
                  onChange={(e) => setVitals({ ...vitals, temperature: Number(e.target.value) })}
                  className="w-full border rounded p-1 text-sm"
                />
              </div>
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
              Registrar Paciente
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
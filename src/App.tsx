// Author: TheJavier37

import { useState, useEffect } from 'react';
import { useTriageSystem } from './hooks/useTriageSystem';
import { getInitialPatients } from './mock/initialPatients';
import { QueueView } from './components/dashboard/QueueView';
import { HistoryTable } from './components/dashboard/HistoryTable';
import { AlertBanner } from './components/common/AlertBanner';
import { PatientRegistrationModal } from './components/forms/PatientRegistrationModal';
import { VitalSignsUpdateModal } from './components/forms/VitalSignsUpdateModal';
import type { Patient } from './types/triage';

export default function App() {
  const {
    waitingQueue,
    attendedHistory,
    alerts,
    averageWaitTimeMinutes,
    registerPatient,
    updatePatientVitals,
    attendNextPatient,
    clearAlerts,
  } = useTriageSystem();

  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);

  // Carga de datos de prueba al iniciar
  useEffect(() => {
    const initialPatients = getInitialPatients();
    initialPatients.forEach((p) => {
      registerPatient(p.fullName, p.age, p.esiLevel, p.vitalSigns, p.id);
    });
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-gray-800">
      {/* Header Institucional */}
      <header className="bg-slate-900 text-white py-4 px-6 shadow-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <span className="text-xs font-semibold text-indigo-400 tracking-wider uppercase">Grupo 8 - Proyecto Integrador</span>
            <h1 className="text-2xl font-black">Hospital Isidro Ayora - Triaje Automatizado</h1>
          </div>
          <button
            onClick={() => setIsRegisterModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm px-4 py-2.5 rounded-xl transition shadow-lg flex items-center gap-2"
          >
            <span>+</span> Registrar Paciente
          </button>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="max-w-7xl mx-auto p-6">
        {/* Banner de Métricas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
            <span className="text-xs font-bold text-gray-400 uppercase">En Espera (Max-Heap)</span>
            <div className="text-3xl font-black text-slate-800 mt-1">{waitingQueue.length}</div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
            <span className="text-xs font-bold text-gray-400 uppercase">Tiempo Promedio de Espera</span>
            <div className="text-3xl font-black text-indigo-600 mt-1">{averageWaitTimeMinutes} min</div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
            <span className="text-xs font-bold text-gray-400 uppercase">Atendidos (Lista Enlazada)</span>
            <div className="text-3xl font-black text-emerald-600 mt-1">{attendedHistory.length}</div>
          </div>
        </div>

        {/* Alertas Dinámicas */}
        <AlertBanner alerts={alerts} onClear={clearAlerts} />

        {/* Tablero Max-Heap */}
        <QueueView
          queue={waitingQueue}
          onAttendNext={attendNextPatient}
          onUpdateVitals={(patient) => setEditingPatient(patient)}
        />

        {/* Lista Enlazada Ordenada */}
        <HistoryTable history={attendedHistory} />
      </main>

      {/* Modales */}
      <PatientRegistrationModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onRegister={registerPatient}
      />

      <VitalSignsUpdateModal
        patient={editingPatient}
        isOpen={!!editingPatient}
        onClose={() => setEditingPatient(null)}
        onUpdate={updatePatientVitals}
      />
    </div>
  );
}
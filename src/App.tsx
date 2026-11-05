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
    <div className="min-h-screen bg-slate-950 font-sans text-slate-100 selection:bg-teal-500 selection:text-slate-950">
      {/* Header Institucional - Color Secundario (30%) + Detalle Acento (10%) */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 shadow-xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-teal-400 animate-pulse" />
              <span className="text-xs font-semibold text-teal-400 tracking-wider uppercase">
                Grupo 8 • Proyecto Integrador
              </span>
            </div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-50">
                Hospital Isidro Ayora <span className="text-teal-400 font-semibold">| Triaje Automatizado</span>
              </h1>
          </div>

          {/* Botón de Acción Principal - Acento (10%) */}
          <button
            onClick={() => setIsRegisterModalOpen(true)}
            className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold text-sm px-5 py-2.5 rounded-lg transition-all duration-200 shadow-lg shadow-teal-500/20 active:scale-95 flex items-center gap-2"
          >
            <span className="text-lg leading-none font-bold">+</span> Registrar Paciente
          </button>
        </div>
      </header>

      {/* Contenido Principal - Dominante (60%) */}
      <main className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Banner de Métricas - Superficies secundarias bien contrastadas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-900 p-5 rounded-xl border border-slate-800/80 shadow-md flex flex-col justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              En Espera (Max-Heap)
            </span>
            <div className="text-3xl font-extrabold text-slate-100 mt-2 flex items-baseline gap-2">
              {waitingQueue.length}
              <span className="text-xs font-normal text-slate-400">pacientes</span>
            </div>
          </div>

          <div className="bg-slate-900 p-5 rounded-xl border border-slate-800/80 shadow-md flex flex-col justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Tiempo Promedio de Espera
            </span>
            <div className="text-3xl font-extrabold text-amber-400 mt-2 flex items-baseline gap-1">
              {averageWaitTimeMinutes} <span className="text-sm font-medium text-slate-400">min</span>
            </div>
          </div>

          <div className="bg-slate-900 p-5 rounded-xl border border-slate-800/80 shadow-md flex flex-col justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Atendidos (Lista Enlazada)
            </span>
            <div className="text-3xl font-extrabold text-emerald-400 mt-2 flex items-baseline gap-2">
              {attendedHistory.length}
              <span className="text-xs font-normal text-slate-400">registros</span>
            </div>
          </div>
        </div>

        {/* Alertas Dinámicas */}
        <AlertBanner alerts={alerts} onClear={clearAlerts} />

        {/* Tablero Max-Heap */}
        <section className="bg-slate-900/60 rounded-xl border border-slate-800/70 p-4">
          <QueueView
            queue={waitingQueue}
            onAttendNext={attendNextPatient}
            onUpdateVitals={(patient) => setEditingPatient(patient)}
          />
        </section>

        {/* Lista Enlazada Ordenada */}
        <section className="bg-slate-900/60 rounded-xl border border-slate-800/70 p-4">
          <HistoryTable history={attendedHistory} />
        </section>
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
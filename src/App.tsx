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

  // Carga inicial de datos de prueba
  useEffect(() => {
    const initialPatients = getInitialPatients();
    initialPatients.forEach((p) => {
      registerPatient(p.fullName, p.age, p.esiLevel, p.vitalSigns, p.id);
    });
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-100 antialiased selection:bg-cyan-500 selection:text-slate-950">
      
      {/* Header Institucional de Telemetría */}
      <header className="bg-slate-900/90 border-b border-slate-800/80 sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto py-3.5 px-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
              <span className="text-[10px] font-mono font-bold text-cyan-400 tracking-widest uppercase">
                Grupo 8 • Sistema de Control Clínico
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-slate-50 mt-0.5">
              Hospital Isidro Ayora <span className="text-cyan-400 font-semibold text-lg">| Triaje Max-Heap</span>
            </h1>
          </div>

          <button
            onClick={() => setIsRegisterModalOpen(true)}
            className="bg-cyan-500 hover:bg-cyan-400 active:scale-95 text-slate-950 font-mono font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded-lg transition-all duration-200 shadow-lg shadow-cyan-500/20 flex items-center gap-2"
          >
            <span className="text-base leading-none">+</span>
            <span>Registrar Paciente</span>
          </button>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        
        {/* Banner de Métricas del Sistema (60-30-10) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* Métrico 1: En Espera */}
          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800/80 shadow-md flex justify-between items-center">
            <div>
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                En Espera (Max-Heap)
              </span>
              <div className="text-3xl font-mono font-black text-slate-100 mt-1 tabular-nums">
                {waitingQueue.length}
              </div>
            </div>
            <div className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center font-mono text-[11px] font-bold text-cyan-400 shrink-0 whitespace-nowrap">
              O(log n)
            </div>
          </div>
          
          {/* Métrico 2: Tiempo Promedio */}
          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800/80 shadow-md flex justify-between items-center">
            <div>
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                Tiempo Promedio de Espera
              </span>
              <div className="text-3xl font-mono font-black text-amber-400 mt-1 tabular-nums">
                {averageWaitTimeMinutes} <span className="text-xs font-sans font-normal text-slate-400">min</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center text-amber-400 font-mono text-sm">
              ⏱
            </div>
          </div>

          {/* Métrico 3: Atendidos */}
          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800/80 shadow-md flex justify-between items-center">
            <div>
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                Atendidos (Lista Enlazada)
              </span>
              <div className="text-3xl font-mono font-black text-emerald-400 mt-1 tabular-nums">
                {attendedHistory.length}
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center font-mono text-xs font-bold text-emerald-400">
              O(1)
            </div>
          </div>

        </div>

        {/* Banner de Alertas Críticas */}
        <AlertBanner alerts={alerts} onClear={clearAlerts} />

        {/* Tablero de Prioridad Max-Heap */}
        <QueueView
          queue={waitingQueue}
          onAttendNext={attendNextPatient}
          onUpdateVitals={(patient) => setEditingPatient(patient)}
        />

        {/* Histórico de Atendidos (Lista Enlazada Ordenada) */}
        <HistoryTable history={attendedHistory} />
      </main>

      {/* Ventanas Emergentes (Modales) */}
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
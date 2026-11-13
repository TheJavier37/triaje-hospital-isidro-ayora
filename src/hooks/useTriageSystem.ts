// Author: TheJavier37

import { useState, useRef, useCallback } from 'react';
import type {
  Patient,
  ReorderAlert,
  VitalSigns,
  EsiLevel,
} from '../types/triage';
import { MaxHeap } from '../structures/MaxHeap';
import { LinkedList } from '../structures/LinkedList';
import { calculatePriorityScore } from '../utils/esiCalculator';

/**
 * Gestiona la cola de triaje, la atención de pacientes y el historial.
 *
 * Mantiene MaxHeap y LinkedList entre renders mediante useRef,
 * mientras React administra los datos que necesita mostrar la interfaz.
 */
export function useTriageSystem() {
  const maxHeapRef = useRef<MaxHeap>(new MaxHeap());
  const historyListRef = useRef<LinkedList>(new LinkedList());

  const [waitingQueue, setWaitingQueue] = useState<Patient[]>([]);
  const [attendedHistory, setAttendedHistory] = useState<
    { patient: Patient; attendedAt: Date }[]
  >([]);
  const [alerts, setAlerts] = useState<ReorderAlert[]>([]);
  const [averageWaitTimeMinutes, setAverageWaitTimeMinutes] = useState(0);

  /**
   * Calcula el tiempo promedio de espera de los pacientes en la cola.
   */
  const updateAverageWaitTime = useCallback(() => {
    const queue = maxHeapRef.current.toArray();

    if (queue.length === 0) {
      setAverageWaitTimeMinutes(0);
      return;
    }

    const now = Date.now();

    const totalWaitMs = queue.reduce((acc, patient) => {
      return acc + (now - new Date(patient.arrivalTime).getTime());
    }, 0);

    const averageMinutes = Math.round(
      totalWaitMs / (queue.length * 1000 * 60)
    );

    setAverageWaitTimeMinutes(averageMinutes);
  }, []);

  /**
   * Sincroniza el estado de React con el contenido actual del MaxHeap.
   */
  const syncQueueState = useCallback(() => {
    setWaitingQueue(maxHeapRef.current.toArray());
    updateAverageWaitTime();
  }, [updateAverageWaitTime]);

  /**
   * Registra un paciente nuevo y lo inserta en la cola de prioridad.
   *
   * @param fullName Nombre completo del paciente.
   * @param age Edad del paciente.
   * @param esiLevel Nivel ESI asignado.
   * @param vitalSigns Signos vitales iniciales.
   * @param id Identificador único del paciente.
   */
  const registerPatient = useCallback((
    fullName: string,
    age: number,
    esiLevel: EsiLevel,
    vitalSigns: VitalSigns,
    id: string
  ) => {
    const arrivalTime = new Date();

    const priorityScore = calculatePriorityScore(
      esiLevel,
      vitalSigns,
      arrivalTime
    );

    const newPatient: Patient = {
      id,
      fullName,
      age,
      esiLevel,
      vitalSigns,
      priorityScore,
      arrivalTime,
      lastUpdated: arrivalTime,
    };

    maxHeapRef.current.insert(newPatient);
    syncQueueState();
  }, [syncQueueState]);

  /**
   * Actualiza los signos vitales de un paciente y recalcula su prioridad.
   *
   * Si el cambio modifica su posición en el MaxHeap, genera una alerta
   * para que la interfaz informe del reordenamiento.
   *
   * @param patientId Identificador del paciente.
   * @param newVitals Nuevos signos vitales.
   */
  const updatePatientVitals = useCallback((
    patientId: string,
    newVitals: VitalSigns
  ) => {
    const patientsBeforeUpdate = maxHeapRef.current.toArray();

    const previousIndex = patientsBeforeUpdate.findIndex(
      patient => patient.id === patientId
    );

    if (previousIndex === -1) return;

    const patient = patientsBeforeUpdate[previousIndex];

    const newScore = calculatePriorityScore(
      patient.esiLevel,
      newVitals,
      patient.arrivalTime
    );

    const updated = maxHeapRef.current.updatePatientPriority(
      patientId,
      newScore,
      newVitals
    );

    if (!updated) return;

    const patientsAfterUpdate = maxHeapRef.current.toArray();

    const newIndex = patientsAfterUpdate.findIndex(
      currentPatient => currentPatient.id === patientId
    );

    if (newIndex !== -1 && previousIndex !== newIndex) {
      const alert: ReorderAlert = {
        patientId,
        patientName: patient.fullName,
        previousPosition: previousIndex + 1,
        newPosition: newIndex + 1,
        reason: 'La actualización de los signos vitales modificó la prioridad del paciente.',
        timestamp: new Date(),
      };

      setAlerts(previousAlerts => [alert, ...previousAlerts]);
    }

    syncQueueState();
  }, [syncQueueState]);

  /**
   * Atiende al paciente con mayor prioridad y lo incorpora al historial.
   *
   * @returns El paciente atendido o null si la cola está vacía.
   */
  const attendNextPatient = useCallback((): Patient | null => {
    const attendedPatient = maxHeapRef.current.extractMax();

    if (!attendedPatient) return null;

    attendedPatient.attendedAt = new Date();

    historyListRef.current.append(attendedPatient);

    setAttendedHistory(historyListRef.current.toArray());
    syncQueueState();

    return attendedPatient;
  }, [syncQueueState]);

  /**
   * Elimina todas las alertas de reordenamiento.
   */
  const clearAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  return {
    waitingQueue,
    attendedHistory,
    alerts,
    averageWaitTimeMinutes,
    registerPatient,
    updatePatientVitals,
    attendNextPatient,
    clearAlerts,
  };
}

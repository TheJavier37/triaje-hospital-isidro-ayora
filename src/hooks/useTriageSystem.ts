// Author: TheJavier37

import { useState, useRef, useCallback } from 'react';
import type { Patient, ReorderAlert, VitalSigns, EsiLevel } from '../types/triage';
import { MaxHeap } from '../structures/MaxHeap';
import { LinkedList } from '../structures/LinkedList';
import { calculatePriorityScore } from '../utils/esiCalculator';

export function useTriageSystem() {
  const maxHeapRef = useRef<MaxHeap>(new MaxHeap());
  const historyListRef = useRef<LinkedList>(new LinkedList());

  const [waitingQueue, setWaitingQueue] = useState<Patient[]>([]);
  const [attendedHistory, setAttendedHistory] = useState<{ patient: Patient; attendedAt: Date }[]>([]);
  const [alerts, setAlerts] = useState<ReorderAlert[]>([]);
  const [averageWaitTimeMinutes, setAverageWaitTimeMinutes] = useState<number>(0);

  const updateAverageWaitTime = useCallback(() => {
    const queue = maxHeapRef.current.getPatients();
    if (queue.length === 0) {
      setAverageWaitTimeMinutes(0);
      return;
    }

    const now = new Date().getTime();
    const totalWaitMs = queue.reduce((acc, patient) => {
      return acc + (now - new Date(patient.arrivalTime).getTime());
    }, 0);

    const avgMinutes = Math.round(totalWaitMs / (queue.length * 1000 * 60));
    setAverageWaitTimeMinutes(avgMinutes);
  }, []);

  const syncQueueState = useCallback(() => {
    setWaitingQueue(maxHeapRef.current.getPatients());
    updateAverageWaitTime();
  }, [updateAverageWaitTime]);

  const registerPatient = useCallback((
    fullName: string,
    age: number,
    esiLevel: EsiLevel,
    vitalSigns: VitalSigns,
    id: string
  ) => {
    const arrivalTime = new Date();
    const priorityScore = calculatePriorityScore(esiLevel, vitalSigns, arrivalTime);

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

  const updatePatientVitals = useCallback((patientId: string, newVitals: VitalSigns) => {
    const patient = maxHeapRef.current.getPatients().find(p => p.id === patientId);
    if (!patient) return;

    const updatedAt = new Date();
    const newScore = calculatePriorityScore(patient.esiLevel, newVitals, patient.arrivalTime);

    patient.vitalSigns = newVitals;

    const alert = maxHeapRef.current.updatePatientPriority(patientId, newScore, updatedAt);

    if (alert) {
      setAlerts((prev) => [alert, ...prev]);
    }

    syncQueueState();
  }, [syncQueueState]);

const attendNextPatient = useCallback(() => {
  const attendedPatient = maxHeapRef.current.extractMax();
  if (!attendedPatient) return null;

  // Asignar el timestamp de atención
  attendedPatient.attendedAt = new Date();

  historyListRef.current.append(attendedPatient);
  setAttendedHistory(historyListRef.current.toArray());
  syncQueueState();

  return attendedPatient;
}, [syncQueueState]);

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
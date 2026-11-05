// Author: TheJavier37

import { useState, useRef, useCallback } from 'react';
import type { Patient, ReorderAlert, VitalSigns, EsiLevel } from '../types/triage';
import { MaxHeap } from '../structures/MaxHeap';
import { LinkedList } from '../structures/LinkedList';
import { calculatePriorityScore } from '../utils/esiCalculator';
import { validatePatientData, validateVitalSigns } from '../utils/vitalSignsValidation';
import type { ValidationResult } from '../utils/vitalSignsValidation';

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
  ): ValidationResult => {
    // Validación defensiva: aunque el formulario ya valida, el hook nunca acepta datos imposibles.
    const result = validatePatientData({ fullName, id, age, esiLevel, vitalSigns });
    const cleanId = id.trim();

    if (result.isValid && maxHeapRef.current.getPatients().some((p) => p.id === cleanId)) {
      return { isValid: false, errors: { id: 'Ya existe un paciente en espera con esa cédula / ID' } };
    }
    if (!result.isValid) return result;

    const arrivalTime = new Date();
    const priorityScore = calculatePriorityScore(esiLevel, vitalSigns, arrivalTime);

    const newPatient: Patient = {
      id: cleanId,
      fullName: fullName.trim(),
      age,
      esiLevel,
      vitalSigns,
      priorityScore,
      arrivalTime,
      lastUpdated: arrivalTime,
    };

    maxHeapRef.current.insert(newPatient);
    syncQueueState();
    return result;
  }, [syncQueueState]);

  const updatePatientVitals = useCallback((patientId: string, newVitals: VitalSigns): ValidationResult => {
    const result = validateVitalSigns(newVitals);
    if (!result.isValid) return result;

    const patient = maxHeapRef.current.getPatients().find(p => p.id === patientId);
    if (!patient) return { isValid: false, errors: { id: 'El paciente ya no está en la cola de espera' } };

    const updatedAt = new Date();
    const newScore = calculatePriorityScore(patient.esiLevel, newVitals, patient.arrivalTime);

    patient.vitalSigns = newVitals;

    const alert = maxHeapRef.current.updatePatientPriority(patientId, newScore, updatedAt);

    if (alert) {
      setAlerts((prev) => [alert, ...prev]);
    }

    syncQueueState();
    return result;
  }, [syncQueueState]);

  const attendNextPatient = useCallback(() => {
    const attendedPatient = maxHeapRef.current.extractMax();
    if (!attendedPatient) return null;

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
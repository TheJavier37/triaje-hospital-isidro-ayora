// @vitest-environment jsdom
// Author: TheJavier37

import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTriageSystem } from '../hooks/useTriageSystem';
import type { EsiLevel, VitalSigns } from '../types/triage';

const createVitals = (overrides: Partial<VitalSigns> = {}): VitalSigns => ({
  heartRate: 82,
  saturation: 98,
  systolicBP: 120,
  diastolicBP: 80,
  temperature: 36.8,
  respiratoryRate: 16,
  ...overrides,
});

const register = (
  result: { current: ReturnType<typeof useTriageSystem> },
  id: string,
  fullName: string,
  esiLevel: EsiLevel,
  vitalSigns: VitalSigns = createVitals()
) => {
  act(() => {
    result.current.registerPatient(fullName, 38, esiLevel, vitalSigns, id);
  });
};

describe('useTriageSystem - Hook de Triaje (Hospital Isidro Ayora)', () => {
  it('debe registrar un paciente, reflejarlo en waitingQueue y trasladarlo a attendedHistory al atenderlo', () => {
    const { result } = renderHook(() => useTriageSystem());

    expect(result.current.waitingQueue).toHaveLength(0);
    expect(result.current.attendedHistory).toHaveLength(0);

    // 1. Registro del paciente
    register(result, '1102345678', 'Jonathan Loaiza', 4);

    expect(result.current.waitingQueue).toHaveLength(1);
    expect(result.current.waitingQueue[0].id).toBe('1102345678');
    expect(result.current.waitingQueue[0].fullName).toBe('Jonathan Loaiza');
    expect(result.current.waitingQueue[0].esiLevel).toBe(4);
    expect(result.current.waitingQueue[0].priorityScore).toBeGreaterThan(0);

    // 2. Atención del paciente (cola con un solo elemento)
    let attended: ReturnType<typeof result.current.attendNextPatient> = null;
    act(() => {
      attended = result.current.attendNextPatient();
    });

    expect(attended).not.toBeNull();
    expect(attended!.id).toBe('1102345678');
    expect(attended!.attendedAt).toBeInstanceOf(Date);

    // 3. La cola queda vacía y el paciente pasa al historial
    expect(result.current.waitingQueue).toHaveLength(0);
    expect(result.current.attendedHistory).toHaveLength(1);
    expect(result.current.attendedHistory[0].patient.id).toBe('1102345678');
    expect(result.current.attendedHistory[0].attendedAt).toBeInstanceOf(Date);

    // 4. attendNextPatient sobre cola vacía retorna null
    let emptyResult: ReturnType<typeof result.current.attendNextPatient> = null;
    act(() => {
      emptyResult = result.current.attendNextPatient();
    });
    expect(emptyResult).toBeNull();
  });

  it('debe generar una alerta de reordenamiento cuando los signos vitales críticos elevan la prioridad del paciente', () => {
    const { result } = renderHook(() => useTriageSystem());

    // Paciente estable de baja prioridad (ESI 4)
    register(result, 'pac-estable', 'Camila Riofrío', 4);
    // Paciente crítico de alta prioridad (ESI 1)
    register(result, 'pac-critico', 'Dayana Guerrero', 1);

    expect(result.current.waitingQueue).toHaveLength(2);
    expect(result.current.alerts).toHaveLength(0);

    // Deterioro clínico del paciente ESI 4: hipoxia severa, taquicardia,
    // taquipnea y shock index >= 1.0 -> su score supera al del ESI 1
    const criticalVitals = createVitals({
      heartRate: 138,
      saturation: 85,
      systolicBP: 120,
      diastolicBP: 80,
      temperature: 39.2,
      respiratoryRate: 30,
    });

    act(() => {
      result.current.updatePatientVitals('pac-estable', criticalVitals);
    });

    // Debe existir exactamente una alerta de reordenamiento
    expect(result.current.alerts).toHaveLength(1);

    const alert = result.current.alerts[0];
    expect(alert.patientId).toBe('pac-estable');
    expect(alert.patientName).toBe('Camila Riofrío');
    expect(alert.previousPosition).toBe(2);
    expect(alert.newPosition).toBe(1);
    expect(alert.reason).toBeTruthy();
    expect(alert.timestamp).toBeInstanceOf(Date);

    // El paciente deteriorado ahora encabeza la cola
    expect(result.current.waitingQueue[0].id).toBe('pac-estable');
    expect(result.current.waitingQueue[0].vitalSigns.saturation).toBe(85);

    // clearAlerts vacía el estado de alertas
    act(() => {
      result.current.clearAlerts();
    });
    expect(result.current.alerts).toHaveLength(0);
  });

  it('no debe generar alerta si la actualización de signos vitales no cambia la posición del paciente', () => {
    const { result } = renderHook(() => useTriageSystem());

    register(result, 'pac-unico', 'Luis Castillo', 3);

    act(() => {
      result.current.updatePatientVitals(
        'pac-unico',
        createVitals({ heartRate: 88 })
      );
    });

    expect(result.current.alerts).toHaveLength(0);
    expect(result.current.waitingQueue).toHaveLength(1);
    expect(result.current.waitingQueue[0].vitalSigns.heartRate).toBe(88);
  });
});

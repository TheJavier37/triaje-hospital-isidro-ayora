// @vitest-environment jsdom
// Author: Diyer Torres

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

type HookResult = ReturnType<typeof useTriageSystem>;

const register = (
  result: { current: HookResult },
  id: string,
  fullName: string,
  esiLevel: EsiLevel,
  vitalSigns: VitalSigns = createVitals()
) => {
  act(() => {
    result.current.registerPatient(fullName, 38, esiLevel, vitalSigns, id);
  });
};

describe('Integración Max-Heap ↔ Sorting ↔ Searching ↔ LinkedList', () => {
  it('getSortedWaitingQueue debe ordenar la cola del heap por priorityScore descendente con ambos algoritmos', () => {
    const { result } = renderHook(() => useTriageSystem());

    register(result, 'pac-esi5', 'Paciente ESI 5', 5);
    register(result, 'pac-esi1', 'Paciente ESI 1', 1);
    register(result, 'pac-esi3', 'Paciente ESI 3', 3);

    const sortedMerge = result.current.getSortedWaitingQueue('merge');
    const sortedQuick = result.current.getSortedWaitingQueue('quick');

    // Ambos algoritmos deben producir el mismo orden
    expect(sortedMerge.map((p) => p.id)).toEqual(sortedQuick.map((p) => p.id));

    // Orden esperado: ESI 1 > ESI 3 > ESI 5 por priorityScore base
    expect(sortedMerge.map((p) => p.esiLevel)).toEqual([1, 3, 5]);
    expect(sortedMerge[0].priorityScore).toBeGreaterThan(
      sortedMerge[1].priorityScore
    );
    expect(sortedMerge[1].priorityScore).toBeGreaterThan(
      sortedMerge[2].priorityScore
    );

    // La función no debe mutar el estado reactivo waitingQueue
    expect(result.current.waitingQueue).toHaveLength(3);
  });

  it('searchPatientById debe localizar al paciente en waiting antes de atenderlo y en attended después', () => {
    const { result } = renderHook(() => useTriageSystem());

    register(result, '1102345678', 'Jonathan Loaiza', 4);
    register(result, '1101239876', 'Domminic Narvaez', 2);

    // Antes de atender: ambos están en 'waiting'
    const inWaiting = result.current.searchPatientById('1102345678');
    expect(inWaiting).not.toBeNull();
    expect(inWaiting!.location).toBe('waiting');
    expect(inWaiting!.patient.fullName).toBe('Jonathan Loaiza');

    // Se atiende al paciente de mayor prioridad (ESI 2)
    let attendedId: string | undefined;
    act(() => {
      attendedId = result.current.attendNextPatient()?.id;
    });
    expect(attendedId).toBe('1101239876');

    // El atendido ya no está en waiting, está en attended
    const attendedResult = result.current.searchPatientById('1101239876');
    expect(attendedResult).not.toBeNull();
    expect(attendedResult!.location).toBe('attended');
    expect(attendedResult!.patient.id).toBe('1101239876');

    // El que sigue en espera sigue reportando 'waiting'
    const stillWaiting = result.current.searchPatientById('1102345678');
    expect(stillWaiting!.location).toBe('waiting');
  });

  it('searchPatientById debe retornar null para un identificador inexistente', () => {
    const { result } = renderHook(() => useTriageSystem());

    register(result, '1102345678', 'Jonathan Loaiza', 4);

    expect(result.current.searchPatientById('9999999999')).toBeNull();
    // También con el hook vacío
    const { result: emptyResult } = renderHook(() => useTriageSystem());
    expect(emptyResult.current.searchPatientById('1102345678')).toBeNull();
  });

  it('el orden de extracción del Max-Heap debe coincidir con la primera posición del ordenamiento multicriterio', () => {
    const { result } = renderHook(() => useTriageSystem());

    register(result, 'pac-a', 'Paciente A', 3);
    register(result, 'pac-b', 'Paciente B', 1);
    register(result, 'pac-c', 'Paciente C', 5);

    const sorted = result.current.getSortedWaitingQueue('merge');

    let extractedId: string | undefined;
    act(() => {
      extractedId = result.current.attendNextPatient()?.id;
    });

    // El paciente extraído por el heap debe ser el primero del ordenamiento
    expect(extractedId).toBe(sorted[0].id);
    expect(extractedId).toBe('pac-b'); // ESI 1 = mayor prioridad
  });
});

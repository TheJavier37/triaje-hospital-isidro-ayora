// Author: TheJavier37

import { describe, it, expect, beforeEach } from 'vitest';
import { MaxHeap } from '../structures/MaxHeap';
import type { EsiLevel, Patient, VitalSigns } from '../types/triage';

const createMockPatient = (
    id: string,
    fullName: string,
    esiLevel: EsiLevel,
    priorityScore: number,
    saturation = 98,
    minutesAgo = 5
    ): Patient => {
    const timestamp = new Date(Date.now() - minutesAgo * 60_000);
    const vitalSigns: VitalSigns = {
        heartRate: 82,
        saturation,
        systolicBP: 120,
        diastolicBP: 80,
        temperature: 36.8,
        respiratoryRate: 16,
    };

    return {
        id,
        fullName,
        age: 38,
        esiLevel,
        vitalSigns,
        priorityScore,
        arrivalTime: timestamp,
        lastUpdated: timestamp,
    };
};

describe('MaxHeap - Cola de Prioridad de Triaje (Hospital Isidro Ayora)', () => {
    let heap: MaxHeap;

    beforeEach(() => {
        heap = new MaxHeap();
    });

    it('debe insertar múltiples pacientes con distintos niveles ESI y mantener el más crítico en peek() en O(1)', () => {
        const pEsi4 = createMockPatient('1102345678', 'Jonathan Loaiza', 4, 240);
        const pEsi3 = createMockPatient('1101239876', 'Domminic Narvaez', 3, 510);
        const pEsi1 = createMockPatient('1105987654', 'Dayana Guerrero', 1, 960);
        const pEsi2 = createMockPatient('1104589231', 'Mateo Yanangomez', 2, 790);

        heap.insert(pEsi4);
        expect(heap.peek()?.id).toBe('1102345678');

        heap.insert(pEsi3);
        expect(heap.peek()?.id).toBe('1101239876');

        heap.insert(pEsi1);
        expect(heap.peek()?.id).toBe('1105987654');

        heap.insert(pEsi2);
        expect(heap.peek()?.id).toBe('1105987654');
        expect(heap.size()).toBe(4);
    });

    it('debe extraer a los pacientes en orden decreciente estricto de priorityScore', () => {
        heap.insert(createMockPatient('1103412567', 'Sofia Sarango', 5, 110));
        heap.insert(createMockPatient('1104589231', 'Mateo Yanangomez', 2, 810));
        heap.insert(createMockPatient('1104928173', 'Carlos Jaramillo', 1, 995));
        heap.insert(createMockPatient('1105192834', 'Luis Castillo', 3, 530));
        heap.insert(createMockPatient('1103948215', 'Andrea Valdivieso', 4, 305));

        const extractedScores: number[] = [];
        while (!heap.isEmpty()) {
        const next = heap.extractMax();
        if (next) {
            extractedScores.push(next.priorityScore);
        }
        }

        expect(extractedScores).toEqual([995, 810, 530, 305, 110]);
        expect(heap.peek()).toBeNull();
    });

    it('debe reordenar dinámicamente y elevar al tope a un paciente ESI 3 cuando su SpO2 cae por debajo de 88%', () => {
        const patientEsi2 = createMockPatient('1101827364', 'Jorge Quezada', 2, 820, 91, 12);
        const patientEsi3 = createMockPatient('1104192837', 'Kevin Cueva', 3, 490, 94, 35);
        const patientEsi4 = createMockPatient('1103819274', 'Camila Riofrío', 4, 230, 98, 22);

        heap.insert(patientEsi2);
        heap.insert(patientEsi3);
        heap.insert(patientEsi4);

        // Inicialmente Jorge (score 820) encabeza la cola
        expect(heap.peek()?.id).toBe('1101827364');

        // Deterioro clínico de Kevin Cueva (ESI 3): saturación cae a 85% (SpO2 < 88)
        const criticalVitals: VitalSigns = {
        ...patientEsi3.vitalSigns,
        saturation: 85,
        heartRate: 138,
        respiratoryRate: 30,
        };
        const newDynamicScore = 945;

        const updated = heap.updatePatientPriority(patientEsi3.id, newDynamicScore, criticalVitals);

        expect(updated).toBe(true);
        expect(heap.peek()?.id).toBe('1104192837');
        expect(heap.peek()?.fullName).toBe('Kevin Cueva');
        expect(heap.peek()?.vitalSigns.saturation).toBe(85);
        expect(heap.peek()?.priorityScore).toBe(945);
    });

    it('debe retornar false si se intenta actualizar un patientId inexistente', () => {
        heap.insert(createMockPatient('1102345678', 'Jonathan Loaiza', 4, 240));
        expect(heap.updatePatientPriority('9999999999', 900)).toBe(false);
    });
});
// src/structures/performance.test.ts
import { describe, it, expect } from 'vitest';
import { MaxHeap } from './MaxHeap';
import { LinkedList } from './LinkedList';
import type { Patient } from '../types/triage';

function crearPacientePrueba(id: number): Patient {
    return {
    id: `PAC-${id}`,
    fullName: `Paciente ${id}`,
    age: 30,
    esiLevel: (Math.floor(Math.random() * 5) + 1) as any,
    vitalSigns: {
        heartRate: 80 + (id % 40),
        saturation: 95 - (id % 15),
        systolicBP: 120,
        diastolicBP: 80,
        temperature: 37,
        respiratoryRate: 18,
    },
        priorityScore: Math.floor(Math.random() * 1000),
        arrivalTime: new Date(),
        lastUpdated: new Date(),
    };
}

describe('Pruebas de Tiempo de Ejecución (Benchmarking)', () => {
    it('Mide tiempos de ejecución en MaxHeap y LinkedList', () => {
        const heap = new MaxHeap();
        const list = new LinkedList();
    
        // 1. Inserción de Carga Diaria (150 pacientes)
        const t0 = performance.now();
        for (let i = 0; i < 150; i++) {
            heap.insert(crearPacientePrueba(i));
        }
        const tInsercion = performance.now() - t0;

        // 2. Re-evaluación y Reordenamiento
        const t1 = performance.now();
        const patientToUpdate = heap.toArray().find(
        patient => patient.id === 'PAC-50'
        );

        if (patientToUpdate) {
        heap.updatePatientPriority(
            'PAC-50',
            1500,
            patientToUpdate.vitalSigns
        );
        }
        const tReorden = performance.now() - t1;

        // 3. Extracción del Más Grave
        const t2 = performance.now();
        const atendido = heap.extractMax();
        const tExtraccion = performance.now() - t2;

        // 4. Inserción en Historial (LinkedList)
        const t3 = performance.now();
        if (atendido) list.append(atendido);
        const tHistorial = performance.now() - t3;

        console.log(`\n========================================`);
        console.log(`TIEMPOS REALES DE EJECUCIÓN (n = 150)`);
        console.log(`========================================`);
        console.log(`Inserción (150 pac):   ${tInsercion.toFixed(4)} ms`);
        console.log(`Reordenamiento:        ${tReorden.toFixed(4)} ms`);
        console.log(`Extracción (extractMax):${tExtraccion.toFixed(4)} ms`);
        console.log(`Historial (LinkedList):${tHistorial.toFixed(4)} ms`);
        console.log(`========================================\n`);

        expect(tReorden).toBeLessThan(1.0);
    });
});
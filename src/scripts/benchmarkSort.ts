// src/scripts/benchmarkSort.ts

import type { Patient } from '../types/triage';
import {
    mergeSortPatients,
    quickSortPatients,
    defaultTriageComparator,
} from '../algorithms/sorting';

/**
 * Genera un conjunto de datos sintéticos de pacientes para pruebas de rendimiento.
 */
function generateMockPatients(count: number): Patient[] {
    const patients: Patient[] = [];
    const baseTime = Date.now();

    for (let i = 0; i < count; i++) {
        const esi = (Math.floor(Math.random() * 5) + 1) as 1 | 2 | 3 | 4 | 5;
        // Prioridad invertida (6 - ESI) + penalización aleatoria por signos vitales
        const priorityScore = (6 - esi) * 20 + Math.floor(Math.random() * 25);

        patients.push({
        id: `PAT-${i + 1}`,
        fullName: `Paciente Prueba ${i + 1}`,
        age: Math.floor(Math.random() * 90) + 1,
        esiLevel: esi,
        priorityScore,
        arrivalTime: new Date(baseTime - Math.floor(Math.random() * 3600000)),
        lastUpdated: new Date(),
        } as Patient);
    }

    return patients;
}

/**
 * Ejecuta la comparativa de rendimiento entre MergeSort y QuickSort.
 */
export function runSortingBenchmark(): void {
    const volumes = [100, 1000, 5000, 10000, 50000];
    const results: {
        Volumen: number;
        'MergeSort (ms)': string;
        'QuickSort (ms)': string;
        'Orden Verificado': string;
    }[] = [];

    console.log('=== BENCHMARK DE ORDENAMIENTO - HOSPITAL ISIDRO AYORA ===\n');

    for (const n of volumes) {
        const dataset = generateMockPatients(n);

        // 1. Medición MergeSort
        const startMerge = performance.now();
        const sortedMerge = mergeSortPatients(dataset, defaultTriageComparator);
        const endMerge = performance.now();
        const mergeTime = (endMerge - startMerge).toFixed(4);

        // 2. Medición QuickSort
        const startQuick = performance.now();
        const sortedQuick = quickSortPatients(dataset, defaultTriageComparator);
        const endQuick = performance.now();
        const quickTime = (endQuick - startQuick).toFixed(4);

        // Verificación rápida de integridad (primer elemento debe ser >= segundo)
        const isValid =
        sortedMerge.length === n &&
        sortedQuick.length === n &&
        sortedMerge[0].priorityScore >= sortedMerge[n - 1].priorityScore;

        results.push({
        Volumen: n,
        'MergeSort (ms)': `${mergeTime} ms`,
        'QuickSort (ms)': `${quickTime} ms`,
        'Orden Verificado': isValid ? 'OK' : 'ERROR',
        });
    }

    console.table(results);
}

// Ejecutar automáticamente si se corre desde consola
runSortingBenchmark();
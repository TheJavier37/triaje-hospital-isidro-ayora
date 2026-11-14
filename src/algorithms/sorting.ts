// src/algorithms/sorting.ts

import type { Patient } from '../types/triage';

/**
 * Tipo para funciones comparadoras multicriterio.
 * Retorna > 0 si 'a' va antes que 'b', < 0 si 'b' va antes, 0 si son iguales.
 */
export type PatientComparator = (a: Patient, b: Patient) => number;

/**
 * Comparador médico por defecto (Multicriterio):
 * 1. Mayor Priority Score (Gravedad clínica).
 * 2. Desempate por menor nivel ESI (1 es más crítico que 5).
 * 3. Desempate por mayor tiempo de espera (llegada más antigua primero).
 */
export const defaultTriageComparator: PatientComparator = (a: Patient, b: Patient): number => {
    // 1. Criterio principal: Priority Score (Descendente)
    if (a.priorityScore !== b.priorityScore) {
        return b.priorityScore - a.priorityScore;
    }

    // 2. Primer desempate: Nivel ESI (Ascendente: ESI 1 antes que ESI 2)
    if (a.esiLevel !== undefined && b.esiLevel !== undefined && a.esiLevel !== b.esiLevel) {
        return a.esiLevel - b.esiLevel;
    }

    // 3. Segundo desempate: Tiempo de espera (Ascendente por fecha de ingreso/actualización)
    const timeA = a.arrivalTime ? new Date(a.arrivalTime).getTime() : 0;
    const timeB = b.arrivalTime ? new Date(b.arrivalTime).getTime() : 0;
    if (timeA !== timeB) {
        return timeA - timeB;
    }

    // 4. Tercer desempate opcional: Edad (Pacientes mayores primero)
    const ageA = a.age ?? 0;
    const ageB = b.age ?? 0;
    return ageB - ageA;
};

// ============================================================================
// 1. MERGESORT (Estable - O(n log n) en todos los casos)
// ============================================================================

export function mergeSortPatients(
    patients: Patient[],
    compareFn: PatientComparator = defaultTriageComparator
    ): Patient[] {
    // Caso base: arreglos de 0 o 1 elemento ya están ordenados
    if (patients.length <= 1) {
        return [...patients];
    }

    const mid = Math.floor(patients.length / 2);
    const leftHalf = mergeSortPatients(patients.slice(0, mid), compareFn);
    const rightHalf = mergeSortPatients(patients.slice(mid), compareFn);

    return merge(leftHalf, rightHalf, compareFn);
    }

    function merge(
    left: Patient[],
    right: Patient[],
    compareFn: PatientComparator
    ): Patient[] {
    const result: Patient[] = [];
    let i = 0;
    let j = 0;

    while (i < left.length && j < right.length) {
        // <= 0 mantiene la estabilidad del algoritmo ante empates
        if (compareFn(left[i], right[j]) <= 0) {
        result.push(left[i]);
        i++;
        } else {
        result.push(right[j]);
        j++;
        }
    }

    // Agregar elementos restantes sin usar métodos nativos de ordenamiento
    while (i < left.length) {
        result.push(left[i]);
        i++;
    }

    while (j < right.length) {
        result.push(right[j]);
        j++;
    }

    return result;
}

// ============================================================================
// 2. QUICKSORT (In-place / Partición de Lomuto o Hoare - O(n log n) promedio)
// ============================================================================

export function quickSortPatients(
    patients: Patient[],
    compareFn: PatientComparator = defaultTriageComparator
    ): Patient[] {
    // Clonamos el arreglo para no mutar el estado original en React / V8
    const arr = [...patients];
    quickSortRecursive(arr, 0, arr.length - 1, compareFn);
    return arr;
    }

    function quickSortRecursive(
    arr: Patient[],
    low: number,
    high: number,
    compareFn: PatientComparator
    ): void {
    if (low < high) {
        const pivotIndex = partition(arr, low, high, compareFn);
        quickSortRecursive(arr, low, pivotIndex - 1, compareFn);
        quickSortRecursive(arr, pivotIndex + 1, high, compareFn);
    }
}

function partition(
    arr: Patient[],
    low: number,
    high: number,
    compareFn: PatientComparator
    ): number {
    // Pivote al medio para evitar peor caso O(n^2) en listas ya ordenadas
    const mid = Math.floor((low + high) / 2);
    swap(arr, mid, high);

    const pivot = arr[high];
    let i = low - 1;

    for (let j = low; j < high; j++) {
        if (compareFn(arr[j], pivot) <= 0) {
        i++;
        swap(arr, i, j);
        }
    }

    swap(arr, i + 1, high);
    return i + 1;
    }

    function swap(arr: Patient[], i: number, j: number): void {
    const temp = arr[i];
    arr[i] = arr[j];
    arr[j] = temp;
}
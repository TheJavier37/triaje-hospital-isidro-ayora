// src/scripts/demoSortBeforeAfter.ts
import {
    mergeSortPatients,
    quickSortPatients,
    defaultTriageComparator,
} from '../algorithms/sorting';
import { getInitialPatients } from '../mock/initialPatients';
import type { Patient } from '../types/triage';

// Obtenemos los pacientes iniciales reales con su priorityScore ya calculado
const pacientesIniciales = getInitialPatients();

// Función auxiliar para formatear las columnas en consola
const formatearTabla = (pacientes: Patient[]) =>
    pacientes.map((p) => ({
        ID: p.id,
        Paciente: p.fullName,
        Score: p.priorityScore,
        ESI: `Nivel ${p.esiLevel}`,
        Llegada: new Date(p.arrivalTime).toTimeString().slice(0, 5),
        Edad: p.age,
    }));

console.log('\n=====================================================================');
console.log('1. ANTES DEL ORDENAMIENTO (Dataset original en getInitialPatients)');
console.log('=====================================================================');
console.table(formatearTabla(pacientesIniciales));

const ordenadoMerge = mergeSortPatients(pacientesIniciales, defaultTriageComparator);
console.log('\n=====================================================================');
console.log('2. DESPUÉS DE MERGESORT (Multicriterio: Score > ESI > Llegada > Edad)');
console.log('=====================================================================');
console.table(formatearTabla(ordenadoMerge));

const ordenadoQuick = quickSortPatients(pacientesIniciales, defaultTriageComparator);
console.log('\n=====================================================================');
console.log('3. DESPUÉS DE QUICKSORT (Verificación de equivalencia e inmutabilidad)');
console.log('=====================================================================');
console.table(formatearTabla(ordenadoQuick));
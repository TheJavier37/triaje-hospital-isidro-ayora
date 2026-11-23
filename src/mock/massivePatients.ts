// Generador de data masiva de pacientes simulados — issue #9 (Ricardo Ochoa)
//
// Produce datasets escalables (100, 1.000, 10.000, 50.000 ... registros) con
// signos vitales coherentes con su nivel ESI, cédulas ecuatorianas válidas y
// un Priority Score calculado con el mismo motor que usa la aplicación.
//
// Es determinista: la misma semilla produce siempre el mismo dataset, de modo
// que los benchmarks son reproducibles. No depende de APIs de Node, por lo que
// también puede usarse desde el navegador.

import type { EsiLevel, Patient, VitalSigns } from '../types/triage';
import { calculatePriorityScore } from '../utils/esiCalculator';

/** Tamaños de dataset pedidos en el issue #9. */
export const STRESS_DATASET_SIZES = [100, 1_000, 10_000, 50_000] as const;

/** Capacidad máxima de cédulas únicas que genera `buildEcuadorianId`. */
export const MAX_MASSIVE_PATIENTS = 128_000;

export interface MassivePatientsOptions {
  /** Semilla del generador pseudoaleatorio (por defecto 2026). */
  seed?: number;
  /** Instante de referencia para horas de llegada y score (por defecto, ahora). */
  now?: Date;
}

/** Generador pseudoaleatorio Mulberry32: rápido, de 32 bits y reproducible. */
function createRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Rng = () => number;

const randInt = (rng: Rng, min: number, max: number): number =>
  min + Math.floor(rng() * (max - min + 1));

const randFloat = (rng: Rng, min: number, max: number, decimals = 1): number =>
  Number((min + rng() * (max - min)).toFixed(decimals));

/** Distribución realista de un servicio de urgencias (suma 1). */
const ESI_DISTRIBUTION: ReadonlyArray<readonly [EsiLevel, number]> = [
  [1, 0.05],
  [2, 0.15],
  [3, 0.35],
  [4, 0.3],
  [5, 0.15],
];

function pickEsi(rng: Rng): EsiLevel {
  const r = rng();
  let acc = 0;
  for (const [level, weight] of ESI_DISTRIBUTION) {
    acc += weight;
    if (r < acc) return level;
  }
  return 5;
}

/**
 * Signos vitales coherentes con cada nivel ESI. Todos los rangos caen dentro de
 * los límites que acepta `validateVitalSigns` (la diastólica siempre es menor
 * que la sistólica).
 */
function generateVitalSigns(rng: Rng, esi: EsiLevel): VitalSigns {
  switch (esi) {
    case 1: {
      const systolicBP = randInt(rng, 55, 85);
      return {
        heartRate: randInt(rng, 130, 175),
        saturation: randInt(rng, 72, 87),
        systolicBP,
        diastolicBP: randInt(rng, 30, Math.min(55, systolicBP - 10)),
        temperature: randFloat(rng, 34.0, 36.2),
        respiratoryRate: randInt(rng, 30, 40),
      };
    }
    case 2: {
      const systolicBP = randInt(rng, 85, 200);
      return {
        heartRate: randInt(rng, 105, 140),
        saturation: randInt(rng, 86, 93),
        systolicBP,
        diastolicBP: randInt(rng, 50, Math.min(120, systolicBP - 15)),
        temperature: randFloat(rng, 36.0, 40.0),
        respiratoryRate: randInt(rng, 22, 30),
      };
    }
    case 3:
      return {
        heartRate: randInt(rng, 80, 110),
        saturation: randInt(rng, 92, 97),
        systolicBP: randInt(rng, 110, 150),
        diastolicBP: randInt(rng, 70, 95),
        temperature: randFloat(rng, 36.5, 38.8),
        respiratoryRate: randInt(rng, 16, 24),
      };
    case 4:
      return {
        heartRate: randInt(rng, 65, 95),
        saturation: randInt(rng, 96, 99),
        systolicBP: randInt(rng, 105, 130),
        diastolicBP: randInt(rng, 65, 85),
        temperature: randFloat(rng, 36.2, 37.6),
        respiratoryRate: randInt(rng, 13, 19),
      };
    default:
      return {
        heartRate: randInt(rng, 60, 85),
        saturation: randInt(rng, 97, 100),
        systolicBP: randInt(rng, 100, 125),
        diastolicBP: randInt(rng, 62, 80),
        temperature: randFloat(rng, 36.3, 37.2),
        respiratoryRate: randInt(rng, 12, 18),
      };
  }
}

/**
 * Construye una cédula ecuatoriana válida (provincia 11, Loja) a partir de un
 * índice. Índices distintos producen cédulas distintas.
 */
export function buildEcuadorianId(index: number): string {
  if (index < 0 || index >= MAX_MASSIVE_PATIENTS) {
    throw new RangeError(`El índice debe estar entre 0 y ${MAX_MASSIVE_PATIENTS - 1}`);
  }
  // 6 dígitos con paso 7 para repartir las claves y evitar un patrón secuencial.
  const sequence = String(100_000 + index * 7).padStart(6, '0');
  const base = `110${sequence}`; // provincia 11 + tercer dígito 0 + 6 dígitos
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    let product = Number(base[i]) * (i % 2 === 0 ? 2 : 1);
    if (product > 9) product -= 9;
    sum += product;
  }
  return base + String((10 - (sum % 10)) % 10);
}

const FIRST_NAMES = [
  'Juan', 'María', 'Luis', 'Ana', 'Carlos', 'Rosa', 'José', 'Lucía', 'Pedro', 'Carmen',
  'Jorge', 'Elena', 'Miguel', 'Sofía', 'Diego', 'Paola', 'Andrés', 'Gabriela', 'Fernando', 'Valeria',
];
const LAST_NAMES = [
  'Armijos', 'Jaramillo', 'Cueva', 'Ordóñez', 'Burneo', 'Guerrero', 'Sarango', 'Quezada', 'Riofrío', 'Castillo',
  'Tapia', 'Pardo', 'Poma', 'Encalada', 'Aguirre', 'Maldonado', 'Salinas', 'Vivanco', 'Cuenca', 'Valdivieso',
];

/** Fisher–Yates con generador propio (mantiene el resultado reproducible). */
function shuffleInPlace<T>(items: T[], rng: Rng): void {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
}

/**
 * Genera `count` pacientes simulados con ID único, en orden ALEATORIO por ID
 * (como llegan a urgencias). Para la búsqueda binaria hay que ordenarlos antes
 * con {@link sortPatientsById}.
 *
 * @param count Cantidad de pacientes (1 a {@link MAX_MASSIVE_PATIENTS}).
 */
export function generateMassivePatients(
  count: number,
  options: MassivePatientsOptions = {}
): Patient[] {
  if (!Number.isInteger(count) || count < 0 || count > MAX_MASSIVE_PATIENTS) {
    throw new RangeError(`count debe ser un entero entre 0 y ${MAX_MASSIVE_PATIENTS}`);
  }
  const rng = createRng(options.seed ?? 2026);
  const now = options.now ?? new Date();

  const patients: Patient[] = [];
  for (let i = 0; i < count; i++) {
    const esiLevel = pickEsi(rng);
    const vitalSigns = generateVitalSigns(rng, esiLevel);
    const waitingMinutes = randInt(rng, 0, 180);
    const arrivalTime = new Date(now.getTime() - waitingMinutes * 60_000);

    patients.push({
      id: buildEcuadorianId(i),
      fullName: `${FIRST_NAMES[randInt(rng, 0, FIRST_NAMES.length - 1)]} ${LAST_NAMES[randInt(rng, 0, LAST_NAMES.length - 1)]}`,
      age: randInt(rng, 1, 95),
      esiLevel,
      vitalSigns,
      priorityScore: calculatePriorityScore(esiLevel, vitalSigns, arrivalTime, now),
      arrivalTime,
      lastUpdated: arrivalTime,
    });
  }

  shuffleInPlace(patients, rng);
  return patients;
}

/**
 * Devuelve una copia del arreglo ordenada ascendentemente por ID (precondición
 * de la búsqueda binaria). Los IDs son texto de dígitos de igual longitud.
 */
export function sortPatientsById(patients: readonly Patient[]): Patient[] {
  return [...patients].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

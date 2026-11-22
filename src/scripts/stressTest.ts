/// <reference types="node" />
// Suite de pruebas de estrés (benchmarking) — issue #9 (Ricardo Ochoa)
//
// Compara Búsqueda Secuencial vs. Binaria con datasets de 100, 1.000, 10.000 y
// 50.000 pacientes simulados, en dos medios:
//   1. MEMORIA: arreglo en RAM (secuencial sobre el arreglo tal como llega;
//      binaria sobre una copia ordenada por ID).
//   2. ARCHIVO: NDJSON en disco (secuencial = escaneo línea a línea; binaria =
//      índice ordenado + lectura puntual por offset, ver utils/fileIndexer.ts).
//
// Métricas: tiempo promedio por consulta, comparaciones promedio (proxy del
// trabajo de CPU) y tiempo de CPU consumido (process.cpuUsage).
//
// Uso:  npm run stress
// Salida: tablas en consola + docs/CUADRO_COMPARATIVO.md (Cuadro Comparativo Empírico)

import { performance } from 'node:perf_hooks';
import { promises as fs, createReadStream } from 'node:fs';
import { createInterface } from 'node:readline';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Patient } from '../types/triage';
import {
  STRESS_DATASET_SIZES,
  generateMassivePatients,
  sortPatientsById,
} from '../mock/massivePatients';
import { binarySearch, sequentialSearch, defaultCompare } from '../algorithms/searching';
import { buildIndex, findByKey, loadIndex, writeNdjson } from '../utils/fileIndexer';
import { validateVitalSigns } from '../utils/validators';

/** Consultas por escenario en memoria (claves existentes repartidas uniformemente). */
const QUERIES_MEMORY = 500;
/** Consultas por escenario en archivo. El escaneo secuencial en disco es lento, se usan menos. */
const QUERIES_FILE_SEQ = 20;
const QUERIES_FILE_BIN = 500;
/** Repeticiones de la medición en memoria (las búsquedas son sub-milisegundo). */
const MEMORY_ROUNDS = 5;

interface Row {
  size: number;
  medium: 'Memoria' | 'Archivo';
  seqMs: number;
  binMs: number;
  seqComparisons: number;
  binComparisons: number;
  seqCpuMs: number;
  binCpuMs: number;
}

const cpuMs = (usage: NodeJS.CpuUsage): number => (usage.user + usage.system) / 1000;

/** Claves de consulta repartidas uniformemente, incluyendo siempre el último elemento (peor caso). */
function pickQueryKeys(patients: readonly Patient[], count: number): string[] {
  const keys: string[] = [];
  for (let k = 0; k < count; k++) {
    const idx = Math.floor(((k + 1) / count) * (patients.length - 1));
    keys.push(patients[idx].id);
  }
  return keys;
}

/** Escaneo secuencial de un NDJSON leyendo línea a línea hasta encontrar la clave. */
async function sequentialFileScan(dataPath: string, key: string): Promise<{ found: boolean; comparisons: number }> {
  const stream = createReadStream(dataPath, { encoding: 'utf8' });
  const rl = createInterface({ input: stream, crlfDelay: Infinity });
  let comparisons = 0;
  try {
    for await (const line of rl) {
      if (!line) continue;
      comparisons++;
      const record = JSON.parse(line) as { id: string };
      if (record.id === key) return { found: true, comparisons };
    }
    return { found: false, comparisons };
  } finally {
    rl.close();
    stream.destroy();
  }
}

function benchMemory(patients: Patient[]): Row {
  const sorted = sortPatientsById(patients);
  const sequentialKeys = pickQueryKeys(patients, QUERIES_MEMORY);
  const getId = (p: Patient): string => p.id;

  // Verificación de corrección: ambos algoritmos deben ubicar el mismo paciente.
  for (const key of sequentialKeys) {
    const a = patients[sequentialSearch(patients, key, getId)];
    const b = sorted[binarySearch(sorted, key, getId)];
    if (!a || !b || a.id !== key || b.id !== key) {
      throw new Error(`Los algoritmos no encontraron la clave ${key}`);
    }
  }

  // Calentamiento del JIT de V8 para no penalizar al primer algoritmo medido.
  for (let w = 0; w < 30; w++) {
    sequentialSearch(patients, sequentialKeys[w % sequentialKeys.length], getId);
    binarySearch(sorted, sequentialKeys[w % sequentialKeys.length], getId);
  }

  // Tiempo y CPU (sin instrumentar para no distorsionar la medición).
  const totalQueries = QUERIES_MEMORY * MEMORY_ROUNDS;

  let cpu0 = process.cpuUsage();
  let t0 = performance.now();
  for (let r = 0; r < MEMORY_ROUNDS; r++) {
    for (const key of sequentialKeys) sequentialSearch(patients, key, getId);
  }
  const seqMs = (performance.now() - t0) / totalQueries;
  const seqCpuMs = cpuMs(process.cpuUsage(cpu0));

  cpu0 = process.cpuUsage();
  t0 = performance.now();
  for (let r = 0; r < MEMORY_ROUNDS; r++) {
    for (const key of sequentialKeys) binarySearch(sorted, key, getId);
  }
  const binMs = (performance.now() - t0) / totalQueries;
  const binCpuMs = cpuMs(process.cpuUsage(cpu0));

  // Conteo de comparaciones (pasada aparte, instrumentada).
  let seqCount = 0;
  let binCount = 0;
  for (const key of sequentialKeys) {
    sequentialSearch(patients, key, (p) => {
      seqCount++;
      return p.id;
    });
    binarySearch(sorted, key, getId, (a, b) => {
      binCount++;
      return defaultCompare(a, b);
    });
  }

  return {
    size: patients.length,
    medium: 'Memoria',
    seqMs,
    binMs,
    seqComparisons: seqCount / QUERIES_MEMORY,
    binComparisons: binCount / QUERIES_MEMORY,
    // CPU normalizado por consulta para poder comparar ambos algoritmos.
    seqCpuMs: seqCpuMs / totalQueries,
    binCpuMs: binCpuMs / totalQueries,
  };
}

async function benchFile(patients: Patient[], tempDir: string): Promise<{ row: Row; indexMs: number; indexKb: number; dataMb: number }> {
  const n = patients.length;
  const dataPath = join(tempDir, `pacientes_${n}.ndjson`);
  const indexPath = join(tempDir, `pacientes_${n}.idx.json`);

  // El archivo conserva el orden de llegada (sin ordenar); el índice sí está ordenado.
  await writeNdjson(dataPath, patients);
  const tIdx = performance.now();
  await buildIndex(dataPath, indexPath, 'id');
  const indexMs = performance.now() - tIdx;
  const index = await loadIndex(indexPath);
  const dataMb = (await fs.stat(dataPath)).size / (1024 * 1024);
  const indexKb = (await fs.stat(indexPath)).size / 1024;

  const keysSeq = pickQueryKeys(patients, QUERIES_FILE_SEQ);
  const keysBin = pickQueryKeys(patients, QUERIES_FILE_BIN);

  // --- Secuencial: escaneo del archivo línea a línea ---
  let seqComparisons = 0;
  let cpu0 = process.cpuUsage();
  let t0 = performance.now();
  for (const key of keysSeq) {
    const res = await sequentialFileScan(dataPath, key);
    if (!res.found) throw new Error(`Escaneo secuencial no halló ${key}`);
    seqComparisons += res.comparisons;
  }
  const seqMs = (performance.now() - t0) / keysSeq.length;
  const seqCpuMs = cpuMs(process.cpuUsage(cpu0)) / keysSeq.length;

  // --- Binaria: índice ordenado + lectura puntual por offset ---
  const handle = await fs.open(dataPath, 'r');
  let binMs: number;
  let binCpuMs: number;
  try {
    for (const key of keysBin.slice(0, 20)) await findByKey<Patient>(dataPath, index, key, handle); // calentamiento
    cpu0 = process.cpuUsage();
    t0 = performance.now();
    for (const key of keysBin) {
      const record = await findByKey<{ id: string }>(dataPath, index, key, handle);
      if (!record || record.id !== key) throw new Error(`Búsqueda indexada no halló ${key}`);
    }
    binMs = (performance.now() - t0) / keysBin.length;
    binCpuMs = cpuMs(process.cpuUsage(cpu0)) / keysBin.length;
  } finally {
    await handle.close();
  }

  // Comparaciones de la búsqueda binaria sobre el índice (pasada aparte).
  let binCount = 0;
  for (const key of keysBin) {
    binarySearch(index, key, (e) => e.key, (a, b) => {
      binCount++;
      return defaultCompare(a, b);
    });
  }

  return {
    indexMs,
    indexKb,
    dataMb,
    row: {
      size: n,
      medium: 'Archivo',
      seqMs,
      binMs,
      seqComparisons: seqComparisons / keysSeq.length,
      binComparisons: binCount / keysBin.length,
      seqCpuMs,
      binCpuMs,
    },
  };
}

const fmt = (value: number, digits = 4): string => value.toFixed(digits);
const savedPct = (seq: number, bin: number): string => (seq > 0 ? `${((1 - bin / seq) * 100).toFixed(2)} %` : 'n/a');
const speedup = (seq: number, bin: number): string => (bin > 0 ? `${(seq / bin).toFixed(1)}x` : 'n/a');

function buildMarkdown(rows: Row[], extras: Map<number, { indexMs: number; indexKb: number; dataMb: number }>): string {
  const lines: string[] = [];
  lines.push('# Cuadro Comparativo Empírico — Búsqueda Secuencial vs. Binaria');
  lines.push('');
  lines.push('**Sistema de Triaje Automatizado — Hospital Isidro Ayora · Issue #9 (Ricardo Ochoa)**');
  lines.push('');
  lines.push(`Generado automáticamente con \`npm run stress\` el ${new Date().toISOString()}.`);
  lines.push(`Entorno: Node ${process.version} · ${process.platform}/${process.arch}.`);
  lines.push('');
  lines.push('Metodología: dataset determinista (semilla 2026) con signos vitales y nivel ESI; claves de consulta');
  lines.push(`repartidas uniformemente (incluye el último elemento, peor caso). Memoria: ${QUERIES_MEMORY} consultas × ${MEMORY_ROUNDS} rondas.`);
  lines.push(`Archivo: ${QUERIES_FILE_SEQ} consultas secuenciales y ${QUERIES_FILE_BIN} indexadas. Las comparaciones son el proxy de ciclos de CPU;`);
  lines.push('el tiempo de CPU se mide con `process.cpuUsage()`.');
  lines.push('');
  for (const medium of ['Memoria', 'Archivo'] as const) {
    lines.push(`## ${medium === 'Memoria' ? 'En memoria (RAM)' : 'En archivo NDJSON (índice binario + lectura por offset)'}`);
    lines.push('');
    lines.push('| Registros | Secuencial (ms) | Binaria (ms) | Aceleración | Comp. secuencial | Comp. binaria | Ahorro de comparaciones | CPU sec. (ms) | CPU bin. (ms) | Ahorro de CPU |');
    lines.push('|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|');
    for (const r of rows.filter((x) => x.medium === medium)) {
      lines.push(
        `| ${r.size.toLocaleString('es-EC')} | ${fmt(r.seqMs)} | ${fmt(r.binMs)} | ${speedup(r.seqMs, r.binMs)} | ${r.seqComparisons.toFixed(0)} | ${r.binComparisons.toFixed(1)} | ${savedPct(r.seqComparisons, r.binComparisons)} | ${fmt(r.seqCpuMs)} | ${fmt(r.binCpuMs)} | ${savedPct(r.seqCpuMs, r.binCpuMs)} |`
      );
    }
    lines.push('');
  }
  lines.push('## Costo de construir el índice (una sola vez)');
  lines.push('');
  lines.push('| Registros | Archivo de datos (MB) | Índice (KB) | Tiempo de construcción (ms) |');
  lines.push('|---:|---:|---:|---:|');
  for (const [size, e] of extras) {
    lines.push(`| ${size.toLocaleString('es-EC')} | ${e.dataMb.toFixed(2)} | ${e.indexKb.toFixed(1)} | ${e.indexMs.toFixed(1)} |`);
  }
  lines.push('');
  lines.push('## Conclusiones');
  lines.push('');
  lines.push('- La búsqueda secuencial crece de forma **lineal O(n)**: al multiplicar los registros por 500 (100 → 50.000) el trabajo se multiplica en proporción similar.');
  lines.push('- La búsqueda binaria crece de forma **logarítmica O(log n)**: pasa de unas 7 comparaciones (100 registros) a unas 16 (50.000).');
  lines.push('- En archivo la ventaja es mayor, porque evita leer y parsear el archivo completo: solo consulta el índice y lee los bytes de un registro.');
  lines.push('- La binaria exige datos ordenados (o un índice ordenado). El costo de ordenar o indexar se paga una vez y se amortiza cuando hay muchas consultas.');
  lines.push('- Con pocos registros (≈100) en memoria la binaria hace menos comparaciones, pero la diferencia absoluta es de microsegundos y la sobrecarga constante del comparador puede igualarla o incluso superarla en tiempo; la binaria se justifica a partir de miles de registros.');
  lines.push('');
  return lines.join('\n');
}

async function main(): Promise<void> {
  const tempDir = await fs.mkdtemp(join(tmpdir(), 'stress-triaje-'));
  const rows: Row[] = [];
  const extras = new Map<number, { indexMs: number; indexKb: number; dataMb: number }>();

  try {
    for (const size of STRESS_DATASET_SIZES) {
      console.log(`\n▶ Dataset de ${size.toLocaleString('es-EC')} pacientes`);
      const tGen = performance.now();
      const patients = generateMassivePatients(size);
      console.log(`  generado en ${(performance.now() - tGen).toFixed(1)} ms`);

      // Integridad del dataset: IDs únicos y signos vitales fisiológicamente válidos.
      const uniqueIds = new Set(patients.map((p) => p.id));
      const invalid = patients.filter((p) => !validateVitalSigns(p.vitalSigns).isValid).length;
      if (uniqueIds.size !== size) throw new Error('El dataset tiene IDs repetidos');
      if (invalid > 0) throw new Error(`${invalid} pacientes con signos vitales inválidos`);

      rows.push(benchMemory(patients));
      const file = await benchFile(patients, tempDir);
      rows.push(file.row);
      extras.set(size, { indexMs: file.indexMs, indexKb: file.indexKb, dataMb: file.dataMb });
    }

    console.table(
      rows.map((r) => ({
        Registros: r.size,
        Medio: r.medium,
        'Secuencial (ms)': fmt(r.seqMs),
        'Binaria (ms)': fmt(r.binMs),
        Aceleración: speedup(r.seqMs, r.binMs),
        'Comp. sec.': r.seqComparisons.toFixed(0),
        'Comp. bin.': r.binComparisons.toFixed(1),
        'Ahorro comparaciones': savedPct(r.seqComparisons, r.binComparisons),
        'Ahorro CPU': savedPct(r.seqCpuMs, r.binCpuMs),
      }))
    );

    const here = dirname(fileURLToPath(import.meta.url));
    const reportPath = join(here, '..', '..', 'docs', 'CUADRO_COMPARATIVO.md');
    await fs.mkdir(dirname(reportPath), { recursive: true });
    await fs.writeFile(reportPath, buildMarkdown(rows, extras), 'utf8');
    console.log(`\n✔ Cuadro comparativo guardado en ${reportPath}`);
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

/// <reference types="node" />
import { performance } from 'node:perf_hooks';
import { promises as fs } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { sequentialSearch, binarySearch, defaultCompare } from '../algorithms/searching';
import { writeNdjson, buildIndex, loadIndex, findByKey } from '../utils/fileIndexer';

interface PacienteRecord {
    cedula: string;
    nombre: string;
    triaje: number;
}

const VOLUMENES = [1_000, 50_000, 500_000];
const CONSULTAS_POR_ESCENARIO = 200; // Promedio sobre 200 búsquedas por volumen

async function ejecutarBenchmark() {
    const tempDir = await fs.mkdtemp(join(tmpdir(), 'bench-triaje-'));
    const resultados: Record<string, unknown>[] = [];

    try {
        for (const n of VOLUMENES) {
        // 1. Generar dataset ordenado por cédula (requisito de búsqueda binaria)
        const pacientes: PacienteRecord[] = Array.from({ length: n }, (_, i) => ({
            cedula: String(1100000000 + i).padStart(10, '0'),
            nombre: `Paciente Prueba ${i}`,
            triaje: (i % 5) + 1,
        }));

        // Claves de consulta distribuidas uniformemente (incluye peor caso / final)
        const clavesConsulta = Array.from({ length: CONSULTAS_POR_ESCENARIO }, (_, k) =>
            pacientes[Math.floor(((k + 1) / CONSULTAS_POR_ESCENARIO) * (n - 1))].cedula
        );

        // Warm-up del motor JIT V8
        for (let w = 0; w < 20; w++) {
            sequentialSearch(pacientes, clavesConsulta[0], (p) => p.cedula);
            binarySearch(pacientes, clavesConsulta[0], (p) => p.cedula);
        }

        // 2. Benchmark en MEMORIA (Secuencial vs Binaria) + Conteo de comparaciones
        let compSecMem = 0;
        const t0SecMem = performance.now();
        for (const clave of clavesConsulta) {
            sequentialSearch(pacientes, clave, (p) => {
            compSecMem++;
            return p.cedula;
            });
        }
        const tiempoSecMem = (performance.now() - t0SecMem) / CONSULTAS_POR_ESCENARIO;

        let compBinMem = 0;
        const t0BinMem = performance.now();
        for (const clave of clavesConsulta) {
            binarySearch(
            pacientes,
            clave,
            (p) => p.cedula,
            (a, b) => {
                compBinMem++;
                return defaultCompare(a, b);
            }
            );
        }
        const tiempoBinMem = (performance.now() - t0BinMem) / CONSULTAS_POR_ESCENARIO;

        // 3. Benchmark en ARCHIVO NDJSON (Escaneo lineal en disco vs Índice binario + offset)
        const dataPath = join(tempDir, `pacientes_${n}.ndjson`);
        const indexPath = join(tempDir, `pacientes_${n}.idx.json`);
        await writeNdjson(dataPath, pacientes);
        await buildIndex(dataPath, indexPath, 'cedula');
        const index = await loadIndex(indexPath);

        // Búsqueda secuencial leyendo el archivo NDJSON línea por línea (sin índice)
        let compSecDisk = 0;
        const t0SecDisk = performance.now();
        for (const clave of clavesConsulta.slice(0, 20)) {
            const raw = await fs.readFile(dataPath, 'utf8');
            for (const line of raw.split('\n')) {
            if (!line) continue;
            compSecDisk++;
            const obj = JSON.parse(line) as PacienteRecord;
            if (obj.cedula === clave) break;
            }
        }
        const tiempoSecDisk = (performance.now() - t0SecDisk) / 20;

        // Búsqueda binaria sobre índice + lectura puntual por offset en bytes
        const handle = await fs.open(dataPath, 'r');
        const t0BinDisk = performance.now();
        for (const clave of clavesConsulta) {
            await findByKey<PacienteRecord>(dataPath, index, clave, handle);
        }
        const tiempoBinDisk = (performance.now() - t0BinDisk) / CONSULTAS_POR_ESCENARIO;
        await handle.close();

        resultados.push(
            {
            Volumen: n,
            Medio: 'Memoria RAM',
            'Secuencial (ms)': tiempoSecMem.toFixed(4),
            'Comp. Sec.': Math.round(compSecMem / CONSULTAS_POR_ESCENARIO),
            'Binaria (ms)': tiempoBinMem.toFixed(4),
            'Comp. Bin.': Math.round(compBinMem / CONSULTAS_POR_ESCENARIO),
            Aceleracion: `${(tiempoSecMem / tiempoBinMem).toFixed(1)}x`,
            },
            {
            Volumen: n,
            Medio: 'Archivo NDJSON',
            'Secuencial (ms)': tiempoSecDisk.toFixed(4),
            'Comp. Sec.': Math.round(compSecDisk / 20),
            'Binaria (ms)': tiempoBinDisk.toFixed(4),
            'Comp. Bin.': Math.round(compBinMem / CONSULTAS_POR_ESCENARIO),
            Aceleracion: `${(tiempoSecDisk / tiempoBinDisk).toFixed(1)}x`,
            }
        );
        }

        console.table(resultados);
    } finally {
        await fs.rm(tempDir, { recursive: true, force: true });
    }
}

ejecutarBenchmark();
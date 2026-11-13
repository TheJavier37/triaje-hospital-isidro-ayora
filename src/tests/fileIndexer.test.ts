import { describe, it, expect, afterAll } from 'vitest';
import { promises as fs } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { sequentialSearch, sequentialSearchAll, binarySearch } from '../algorithms/searching';
import { writeNdjson, buildIndex, loadIndex, findByKey } from '../utils/fileIndexer';

interface Paciente {
    cedula: string;
    nombre: string;
    triaje: number;
}

describe('Búsquedas e Indexación en Archivos (NDJSON)', () => {
    let tempDir = '';

    afterAll(async () => {
        if (tempDir) await fs.rm(tempDir, { recursive: true, force: true });
    });

    it('debe ejecutar búsqueda secuencial y binaria correctamente en memoria', () => {
        const arr = [10, 20, 20, 30, 40].map((n) => ({ n }));
        expect(sequentialSearch(arr, 30, (x) => x.n)).toBe(3);
        expect(sequentialSearch(arr, 99, (x) => x.n)).toBe(-1);
        expect(sequentialSearchAll(arr, 20, (x) => x.n)).toEqual([1, 2]);
        expect(binarySearch(arr, 20, (x) => x.n)).toBe(1);
        expect(binarySearch([], 1, (x: number) => x)).toBe(-1);
    });

    it('debe indexar y recuperar 10 000 pacientes con caracteres UTF-8 por offset en bytes', async () => {
        tempDir = await fs.mkdtemp(join(tmpdir(), 'triaje-'));
        const dataPath = join(tempDir, 'pacientes.ndjson');
        const indexPath = join(tempDir, 'pacientes.idx.json');

        const N = 10_000;
        const pacientes: Paciente[] = Array.from({ length: N }, (_, i) => ({
        cedula: String((i * 7919) % N).padStart(10, '0'),
        nombre: `Niño Ñandú ${i} áéíóú`,
        triaje: (i % 5) + 1,
        }));

        await writeNdjson(dataPath, pacientes);
        const index = await buildIndex(dataPath, indexPath, 'cedula');
        expect(index).toHaveLength(N);

        const loaded = await loadIndex(indexPath);
        for (const p of [pacientes[0], pacientes[N >> 1], pacientes[N - 1]]) {
        const encontrado = await findByKey<Paciente>(dataPath, loaded, p.cedula);
        expect(encontrado).toEqual(p);
        }

        expect(await findByKey(dataPath, loaded, '9999999999')).toBeNull();
    });
});
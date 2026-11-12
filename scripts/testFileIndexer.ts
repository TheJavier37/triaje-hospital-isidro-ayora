/**
 * Prueba rápida de searching.ts y fileIndexer.ts (solo Node.js).
 * Ejecutar desde la raíz del proyecto:  npx tsx scripts/testFileIndexer.ts
 */
import { promises as fs } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import assert from "node:assert/strict";
import { sequentialSearch, sequentialSearchAll, binarySearch } from "../src/algorithms/searching";
import { writeNdjson, buildIndex, loadIndex, findByKey, findAllByKey } from "../src/utils/fileIndexer";

interface Paciente { cedula: string; nombre: string; triaje: number }

async function main(): Promise<void> {
  const dir = await fs.mkdtemp(join(tmpdir(), "triaje-"));
  const dataPath = join(dir, "pacientes.ndjson");
  const indexPath = join(dir, "pacientes.idx.json");

  // --- Búsquedas en memoria ---
  const arr = [10, 20, 20, 30, 40].map((n) => ({ n }));
  assert.equal(sequentialSearch(arr, 30, (x) => x.n), 3);
  assert.equal(sequentialSearch(arr, 99, (x) => x.n), -1);
  assert.deepEqual(sequentialSearchAll(arr, 20, (x) => x.n), [1, 2]);
  assert.equal(binarySearch(arr, 20, (x) => x.n), 1); // primera aparición
  assert.equal(binarySearch(arr, 99, (x) => x.n), -1);
  assert.equal(binarySearch([], 1, (x: number) => x), -1);

  // --- 10 000 pacientes (con acentos para probar offsets en bytes), desordenados ---
  const N = 10_000;
  const pacientes: Paciente[] = Array.from({ length: N }, (_, i) => ({
    cedula: String((i * 7919) % N).padStart(10, "0"),
    nombre: `Niño Ñandú ${i} áéíóú`,
    triaje: (i % 5) + 1,
  }));
  await writeNdjson(dataPath, pacientes);
  let index = await buildIndex(dataPath, indexPath, "cedula");
  assert.equal(index.length, N);
  index = await loadIndex(indexPath);

  const primero = pacientes[0];
  const ultimo = pacientes[N - 1];
  const medio = pacientes[N >> 1];
  for (const p of [primero, medio, ultimo]) {
    assert.deepEqual(await findByKey<Paciente>(dataPath, index, p.cedula), p);
  }
  assert.equal(await findByKey(dataPath, index, "9999999999"), null);

  // Handle reutilizado para muchas consultas
  const h = await fs.open(dataPath, "r");
  try {
    for (let i = 0; i < 500; i++) {
      const p = pacientes[(i * 13) % N];
      assert.deepEqual(await findByKey<Paciente>(dataPath, index, p.cedula, h), p);
    }
  } finally {
    await h.close();
  }

  // --- CRLF, sin salto final, líneas vacías y claves repetidas ---
  const crlf = join(dir, "crlf.ndjson");
  await fs.writeFile(
    crlf,
    '{"id":2,"v":"b"}\r\n\r\n{"id":1,"v":"a"}\r\n{"id":2,"v":"c"}',
    "utf8",
  );
  const idx2 = await buildIndex(crlf, join(dir, "crlf.idx.json"), "id");
  assert.deepEqual(await findByKey(crlf, idx2, 1), { id: 1, v: "a" });
  assert.deepEqual(await findByKey(crlf, idx2, 2), { id: 2, v: "b" });
  assert.deepEqual(await findAllByKey(crlf, idx2, 2), [{ id: 2, v: "b" }, { id: 2, v: "c" }]);
  assert.deepEqual(await findAllByKey(crlf, idx2, 9), []);

  // --- Errores ---
  const mala = join(dir, "mala.ndjson");
  await fs.writeFile(mala, '{"id":1}\nno-es-json\n', "utf8");
  await assert.rejects(buildIndex(mala, join(dir, "m.idx"), "id"), /no es JSON/);
  await assert.rejects(buildIndex(crlf, join(dir, "n.idx"), "otro"), /no tiene el campo/);

  await fs.rm(dir, { recursive: true, force: true });
  console.log("OK: todas las pruebas pasaron");
}

main().catch((e) => { console.error(e); process.exit(1); });

/// <reference types="node" />
// El tsconfig.app.json del proyecto limita "types" a vite/client; esta directiva
// habilita los tipos de Node (node:fs, Buffer) solo para este módulo.
// IMPORTANTE: este módulo solo corre en Node.js; no debe importarse desde
// código que se empaqueta para el navegador (Vite).

/**
 * @module fileIndexer
 * Indexación en archivos para búsquedas rápidas por cédula / ID de paciente
 * sin cargar todos los registros en memoria (Node.js).
 *
 * Diseño:
 *  - Archivo de DATOS en formato NDJSON: un registro JSON por línea.
 *  - Archivo de ÍNDICE en JSON: arreglo de entradas `{ key, offset, length }`
 *    ordenado por `key` (y por `offset` si la clave se repite). Solo guarda la
 *    clave y la posición en bytes de cada registro, nunca el registro completo.
 *  - Para consultar: se busca la clave en el índice con búsqueda binaria
 *    (O(log n), reutilizando `binarySearch`) y luego se lee del archivo de datos
 *    únicamente los bytes de ese registro con `fs.read` (acceso directo por
 *    posición), sin leer el resto del archivo.
 *
 * Claves: se comparan SIEMPRE como strings (orden lexicográfico). Es coherente
 * entre `buildIndex` y `findByKey`; para cédulas (texto de dígitos) funciona
 * sin problema. Si usas IDs numéricos, "10" < "9" en este orden, pero la
 * búsqueda sigue siendo correcta porque índice y consulta usan el mismo criterio.
 *
 * Claves repetidas: `findByKey` devuelve la primera aparición (en orden del
 * archivo); `findAllByKey` devuelve todas.
 *
 * Nota de memoria: el índice (clave + dos números por registro) es mucho más
 * pequeño que los datos completos, y los registros se leen bajo demanda.
 */

import { promises as fs } from "node:fs";
import type { FileHandle } from "node:fs/promises";
import { binarySearch } from "../algorithms/searching";

/** Entrada del índice: clave y ubicación del registro dentro del archivo de datos. */
export interface IndexEntry {
  /** Clave de búsqueda (cédula o ID del paciente), siempre como string. */
  key: string;
  /** Posición en bytes donde comienza la línea del registro. */
  offset: number;
  /** Longitud en bytes de la línea del registro (sin el salto de línea). */
  length: number;
}

/** Tamaño del bloque de lectura al construir el índice (64 KiB). */
const CHUNK_SIZE = 64 * 1024;

const compareStrings = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);

/**
 * Escribe registros como NDJSON (un JSON por línea) en `dataPath`.
 * Pensado para generar el archivo de datos a partir de los pacientes atendidos.
 *
 * @param dataPath Ruta del archivo de datos a crear (se sobrescribe).
 * @param records  Registros a guardar.
 */
export async function writeNdjson<T>(dataPath: string, records: readonly T[]): Promise<void> {
  const content = records.map((r) => JSON.stringify(r)).join("\n") + (records.length ? "\n" : "");
  await fs.writeFile(dataPath, content, "utf8");
}

/**
 * Construye el índice recorriendo el archivo de datos por bloques, de modo que
 * nunca se carga el archivo completo en memoria, y lo guarda ordenado por clave
 * en `indexPath`.
 *
 * Soporta saltos de línea `\n` y `\r\n`, líneas vacías y un archivo sin salto
 * de línea final.
 *
 * Complejidad: tiempo O(N) para recorrer el archivo + O(n log n) para ordenar
 * las entradas del índice. Memoria: O(n) entradas ligeras + un bloque de 64 KiB.
 *
 * @param dataPath  Archivo NDJSON de datos.
 * @param indexPath Archivo JSON de índice a crear.
 * @param keyField  Nombre del campo que se usa como clave (p. ej. "cedula" o "id").
 * @returns El índice construido (ordenado por clave).
 * @throws Error si una línea no es JSON válido o no tiene el campo clave.
 */
export async function buildIndex(
  dataPath: string,
  indexPath: string,
  keyField: string,
): Promise<IndexEntry[]> {
  const entries: IndexEntry[] = [];
  const handle = await fs.open(dataPath, "r");

  try {
    const buffer = Buffer.alloc(CHUNK_SIZE);
    let filePos = 0; // posición absoluta del inicio del siguiente bloque
    let carry: Buffer = Buffer.alloc(0); // bytes de una línea incompleta del bloque anterior
    let lineStart = 0; // offset absoluto donde empieza la línea actual

    const addLine = (line: Buffer, offset: number): void => {
      // Quita el "\r" final si el archivo usa saltos CRLF.
      const end = line.length > 0 && line[line.length - 1] === 0x0d ? line.length - 1 : line.length;
      if (end === 0) return; // ignora líneas vacías
      const text = line.subarray(0, end);
      let record: Record<string, unknown>;
      try {
        record = JSON.parse(text.toString("utf8")) as Record<string, unknown>;
      } catch {
        throw new Error(`Línea inválida (no es JSON) en el byte ${offset} de ${dataPath}`);
      }
      const key = record[keyField];
      if (key === undefined || key === null) {
        throw new Error(`El registro en el byte ${offset} no tiene el campo "${keyField}"`);
      }
      entries.push({ key: String(key), offset, length: end });
    };

    for (;;) {
      const { bytesRead } = await handle.read(buffer, 0, CHUNK_SIZE, filePos);
      if (bytesRead === 0) break;

      const chunk = carry.length
        ? Buffer.concat([carry, buffer.subarray(0, bytesRead)])
        : buffer.subarray(0, bytesRead);
      let start = 0;
      let nl = chunk.indexOf(0x0a, start); // 0x0a = "\n"

      while (nl !== -1) {
        addLine(chunk.subarray(start, nl), lineStart);
        lineStart += nl - start + 1;
        start = nl + 1;
        nl = chunk.indexOf(0x0a, start);
      }

      // Copia (no vista) para no retener el buffer reutilizado en la siguiente lectura.
      carry = Buffer.from(chunk.subarray(start));
      filePos += bytesRead;
    }

    // Última línea sin salto de línea final.
    if (carry.length > 0) addLine(carry, lineStart);
  } finally {
    await handle.close();
  }

  // Desempata por offset para que las claves repetidas queden en el orden del archivo.
  entries.sort((a, b) => compareStrings(a.key, b.key) || a.offset - b.offset);
  await fs.writeFile(indexPath, JSON.stringify(entries), "utf8");
  return entries;
}

/**
 * Carga el índice desde disco. Contiene solo claves y posiciones, no los datos.
 *
 * @throws Error si el archivo no existe o no tiene el formato esperado.
 */
export async function loadIndex(indexPath: string): Promise<IndexEntry[]> {
  const raw = await fs.readFile(indexPath, "utf8");
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed)) {
    throw new Error(`El índice ${indexPath} no tiene el formato esperado (se esperaba un arreglo)`);
  }
  return parsed as IndexEntry[];
}

/** Lee y parsea el registro descrito por una entrada del índice. */
async function readRecord<T>(handle: FileHandle, entry: IndexEntry): Promise<T> {
  const buf = Buffer.alloc(entry.length);
  const { bytesRead } = await handle.read(buf, 0, entry.length, entry.offset);
  return JSON.parse(buf.subarray(0, bytesRead).toString("utf8")) as T;
}

/**
 * Busca un registro por clave usando el índice y lee SOLO ese registro del
 * archivo de datos. Si la clave se repite, devuelve la primera aparición.
 *
 * Complejidad: O(log n) para ubicar la clave en el índice (búsqueda binaria)
 * + una lectura puntual de `length` bytes en disco.
 *
 * @param dataPath Archivo NDJSON de datos.
 * @param index    Índice cargado con {@link loadIndex} o devuelto por {@link buildIndex}.
 * @param key      Cédula o ID del paciente a buscar.
 * @param handle   (Opcional) Archivo de datos ya abierto con `fs.open(dataPath, "r")`.
 *                 Úselo al hacer muchas consultas seguidas para no abrir y cerrar
 *                 el archivo en cada una; quien lo pasa es responsable de cerrarlo.
 * @returns El registro, o `null` si la clave no está en el índice.
 */
export async function findByKey<T = Record<string, unknown>>(
  dataPath: string,
  index: readonly IndexEntry[],
  key: string | number,
  handle?: FileHandle,
): Promise<T | null> {
  const pos = binarySearch(index, String(key), (e) => e.key, compareStrings);
  if (pos === -1) return null;

  if (handle) return readRecord<T>(handle, index[pos]);

  const own = await fs.open(dataPath, "r");
  try {
    return await readRecord<T>(own, index[pos]);
  } finally {
    await own.close();
  }
}

/**
 * Igual que {@link findByKey} pero devuelve TODOS los registros con esa clave
 * (en el orden en que aparecen en el archivo de datos).
 *
 * Complejidad: O(log n) para la primera aparición + O(k) para los k repetidos.
 *
 * @returns Arreglo de registros (vacío si la clave no existe).
 */
export async function findAllByKey<T = Record<string, unknown>>(
  dataPath: string,
  index: readonly IndexEntry[],
  key: string | number,
  handle?: FileHandle,
): Promise<T[]> {
  const target = String(key);
  const first = binarySearch(index, target, (e) => e.key, compareStrings);
  if (first === -1) return [];

  const own = handle ?? (await fs.open(dataPath, "r"));
  try {
    const results: T[] = [];
    for (let i = first; i < index.length && index[i].key === target; i++) {
      results.push(await readRecord<T>(own, index[i]));
    }
    return results;
  } finally {
    if (!handle) await own.close();
  }
}

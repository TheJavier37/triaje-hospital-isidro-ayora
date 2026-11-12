/**
 * @module searching
 * Algoritmos de búsqueda implementados desde cero (sin Array.prototype.find,
 * indexOf, includes ni similares) para el Sistema de Triaje Automatizado
 * del Hospital Isidro Ayora.
 *
 * Ambos algoritmos son genéricos: reciben una función `getKey` que extrae la
 * clave de búsqueda de cada elemento (por ejemplo, la cédula o el ID del
 * paciente), de modo que no dependen de la estructura concreta del paciente.
 */

/** Función que extrae la clave de búsqueda de un elemento. */
export type KeySelector<T, K> = (item: T) => K;

/**
 * Función de comparación estilo `Array.sort`:
 * negativo si a < b, cero si a === b, positivo si a > b.
 */
export type Comparator<K> = (a: K, b: K) => number;

/**
 * Comparador por defecto para números y strings (usa los operadores < y >).
 * Para strings compara por orden lexicográfico (unidades de código UTF-16),
 * por lo que el arreglo debe haberse ordenado con el mismo criterio.
 */
export function defaultCompare<K extends number | string | bigint>(a: K, b: K): number {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

/**
 * Búsqueda secuencial (lineal).
 *
 * Recorre el arreglo de izquierda a derecha comparando cada elemento con el
 * objetivo hasta encontrarlo. No requiere que el arreglo esté ordenado.
 *
 * Complejidad: tiempo O(n) en el peor caso (elemento al final o ausente),
 * O(1) en el mejor caso (elemento en la posición 0). Espacio O(1).
 *
 * @param items  Arreglo donde buscar.
 * @param target Clave buscada.
 * @param getKey Extrae la clave de cada elemento.
 * @returns Índice de la primera coincidencia, o -1 si no existe.
 *
 * @example
 * sequentialSearch(pacientes, "1100123456", (p) => p.cedula); // 3
 */
export function sequentialSearch<T, K>(
  items: readonly T[],
  target: K,
  getKey: KeySelector<T, K>,
): number {
  for (let i = 0; i < items.length; i++) {
    if (getKey(items[i]) === target) {
      return i;
    }
  }
  return -1;
}

/**
 * Búsqueda secuencial que devuelve TODOS los índices con la clave buscada.
 * Útil cuando la clave puede repetirse (por ejemplo, nivel de triaje).
 *
 * Complejidad: O(n) siempre, porque debe revisar todo el arreglo.
 *
 * @returns Arreglo de índices (vacío si no hay coincidencias).
 */
export function sequentialSearchAll<T, K>(
  items: readonly T[],
  target: K,
  getKey: KeySelector<T, K>,
): number[] {
  const result: number[] = [];
  for (let i = 0; i < items.length; i++) {
    if (getKey(items[i]) === target) {
      result.push(i);
    }
  }
  return result;
}

/**
 * Búsqueda binaria (iterativa).
 *
 * PRECONDICIÓN: `items` debe estar ordenado de forma ascendente por la clave
 * que devuelve `getKey`, con el mismo criterio de `compare`. Si no lo está, el
 * resultado es indefinido.
 *
 * En cada paso compara con el elemento central y descarta la mitad donde el
 * objetivo no puede estar. Cuando hay claves repetidas, continúa buscando a la
 * izquierda para devolver la PRIMERA aparición (límite inferior), lo que sigue
 * siendo O(log n).
 *
 * Complejidad: tiempo O(log n), espacio O(1) (versión iterativa, sin recursión).
 *
 * @param items   Arreglo ordenado ascendentemente por clave.
 * @param target  Clave buscada.
 * @param getKey  Extrae la clave de cada elemento.
 * @param compare Comparador de claves (por defecto, números y strings).
 * @returns Índice de la primera coincidencia, o -1 si no existe.
 *
 * @example
 * binarySearch(pacientesOrdenados, "1100123456", (p) => p.cedula); // 3
 */
export function binarySearch<T, K>(
  items: readonly T[],
  target: K,
  getKey: KeySelector<T, K>,
  compare: Comparator<K> = defaultCompare as unknown as Comparator<K>,
): number {
  let low = 0;
  let high = items.length - 1;
  let found = -1;

  while (low <= high) {
    // Evita el desbordamiento de (low + high) en otros lenguajes; aquí es buena práctica.
    const mid = low + ((high - low) >> 1);
    const cmp = compare(getKey(items[mid]), target);

    if (cmp === 0) {
      found = mid; // candidato; seguimos a la izquierda por si hay repetidos
      high = mid - 1;
    } else if (cmp < 0) {
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }
  return found;
}

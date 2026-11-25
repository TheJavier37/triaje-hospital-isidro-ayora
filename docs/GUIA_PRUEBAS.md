# Guía de Pruebas Funcionales — Sistema de Triaje Automatizado

**Hospital Isidro Ayora · Grupo 8**
**Hito 3 — Code Freeze: 27 de noviembre**

Esta guía contiene los casos de prueba funcionales paso a paso que cada
integrante debe ejecutar durante la sustentación individual. Cada caso
indica las entradas, los pasos y la salida esperada.

---

## Tabla de contenidos

1. [Caso 1 — Registro de paciente](#caso-1--registro-de-paciente)
2. [Caso 2 — Priorización automática (Max-Heap)](#caso-2--priorización-automática-max-heap)
3. [Caso 3 — Actualización de signos vitales y alerta de reordenamiento](#caso-3--actualización-de-signos-vitales-y-alerta-de-reordenamiento)
4. [Caso 4 — Atención de paciente y traslado al historial](#caso-4--atención-de-paciente-y-traslado-al-historial)
5. [Caso 5 — Búsqueda de paciente por ID](#caso-5--búsqueda-de-paciente-por-id)
6. [Caso 6 — Vista ordenada de la cola (Sorting)](#caso-6--vista-ordenada-de-la-cola-sorting)
7. [Casos pendientes de otros módulos](#casos-pendientes-de-otros-módulos)

---

## Caso 1 — Registro de paciente

**Objetivo:** verificar que un paciente nuevo ingresa a la cola de espera
con su score de prioridad calculado.

**Pasos:**

1. Ejecutar `npm run dev` y abrir la aplicación.
2. Presionar el botón **"+ Registrar Paciente"** (esquina superior derecha).
3. Completar el formulario con los siguientes datos:

   | Campo | Valor de prueba |
   |---|---|
   | Nombre completo | `Paciente Prueba Uno` |
   | Edad | `45` |
   | Nivel ESI | `3` |
   | Frecuencia cardíaca | `85` |
   | Saturación SpO2 | `97` |
   | Presión sistólica | `125` |
   | Presión diastólica | `82` |
   | Temperatura | `37.0` |
   | Frecuencia respiratoria | `17` |
   | Cédula/ID | `9990001111` |

4. Confirmar el registro.

**Salida esperada:**

- El paciente aparece en el tablero "En Espera" con su tarjeta.
- El contador **"En Espera (Max-Heap)"** incrementa en 1.
- El paciente muestra `priorityScore` calculado (ESI 3 → base 500 +
  penalización de signos vitales + bono de espera).

---

## Caso 2 — Priorización automática (Max-Heap)

**Objetivo:** verificar que `attendNextPatient` siempre extrae al paciente
de mayor prioridad sin importar el orden de registro.

**Pasos:**

1. Registrar tres pacientes en este orden (datos mínimos válidos):

   | Orden | Nombre | ESI | ID |
   |---|---|---|---|
   | 1° | `Paciente Baja` | `5` | `8880000001` |
   | 2° | `Paciente Critico` | `1` | `8880000002` |
   | 3° | `Paciente Medio` | `3` | `8880000003` |

2. Observar el orden visual de las tarjetas en el tablero.

**Salida esperada:**

- Aunque `Paciente Baja` se registró primero, el orden de prioridad en
  el heap ubica a `Paciente Critico` (ESI 1) en la posición superior.
- La extracción (`attendNextPatient`) devuelve siempre al paciente con
  mayor `priorityScore` — complejidad O(log n).

---

## Caso 3 — Actualización de signos vitales y alerta de reordenamiento

**Objetivo:** verificar la re-categorización dinámica: cuando los signos
vitales de un paciente se deterioran, su posición en la cola cambia y se
genera una alerta visible.

**Pasos:**

1. Registrar dos pacientes:

   | Nombre | ESI | ID |
   |---|---|---|
   | `Paciente Estable` | `4` | `7770000001` |
   | `Paciente Referencia` | `1` | `7770000002` |

2. Sobre `Paciente Estable`, abrir **"Actualizar Signos Vitales"** y
   ingresar valores críticos:

   | Campo | Valor |
   |---|---|
   | Frecuencia cardíaca | `140` |
   | Saturación SpO2 | `85` |
   | Presión sistólica | `120` |
   | Temperatura | `39.2` |
   | Frecuencia respiratoria | `30` |

3. Confirmar la actualización.

**Salida esperada:**

- Aparece una **alerta en el banner de alertas** indicando que el
  paciente cambió de posición (posición anterior 2 → nueva posición 1).
- `Paciente Estable` pasa a encabezar la cola de espera.
- Su `priorityScore` aumenta respecto al valor inicial.
- Al presionar el botón de limpiar alertas (banner), la alerta desaparece.

> Implementación: `useTriageSystem.updatePatientVitals` compara la
> posición del paciente en `MaxHeap.toArray()` antes y después de
> `updatePatientPriority` y construye el `ReorderAlert` (verificado en
> `src/tests/useTriageSystem.test.ts` y `src/tests/integration.test.ts`).

---

## Caso 4 — Atención de paciente y traslado al historial

**Objetivo:** verificar el flujo completo de atención: extracción del
heap → asignación de `attendedAt` → inserción en `LinkedList` →
visualización en historial.

**Pasos:**

1. Con al menos un paciente en espera, presionar **"Atender Siguiente"**
   (o el botón equivalente en `QueueView`).
2. Repetir hasta vaciar la cola.
3. Presionar una vez más con la cola vacía.

**Salida esperada:**

- El paciente atendido es el de mayor prioridad (no necesariamente el
  primero visual si hay empates de score).
- La tarjeta desaparece de "En Espera" y el contador decrementa.
- El contador **"Atendidos (Lista Enlazada)"** incrementa.
- El paciente aparece en la tabla de historial con su hora de atención.
- Con la cola vacía, `attendNextPatient` retorna `null` y la UI no
  muestra errores ni pacientes fantasma.

---

## Caso 5 — Búsqueda de paciente por ID

**Objetivo:** verificar `searchPatientById`, el puente entre el hook y el
módulo de búsquedas (`sequentialSearch` + `LinkedList.findById`).

**Pasos (nivel hook/test):**

```ts
const { result } = renderHook(() => useTriageSystem());
// registrar '1102345678' y '1101239876'
result.current.searchPatientById('1102345678');
```

**Salida esperada:**

- Antes de atender: retorna `{ patient, location: 'waiting' }`.
- Después de `attendNextPatient`: el mismo ID retorna
  `{ patient, location: 'attended' }`.
- ID inexistente (`'9999999999'`) retorna `null` en ambos estados.

---

## Caso 6 — Vista ordenada de la cola (Sorting)

**Objetivo:** verificar `getSortedWaitingQueue`, que alimenta
`mergeSortPatients`/`quickSortPatients` con el array del heap.

**Pasos (nivel hook/test):**

```ts
result.current.getSortedWaitingQueue('merge'); // ordenado por
result.current.getSortedWaitingQueue('quick');  // priorityScore desc
```

**Salida esperada:**

- Ambos algoritmos producen el **mismo orden**: `priorityScore`
  descendente, desempate por ESI ascendente y luego `arrivalTime`.
- El estado `waitingQueue` no se muta (los sorts trabajan sobre copia).
- El primer elemento ordenado coincide con el paciente que
  `attendNextPatient` extraería (verificado en `integration.test.ts`).

---

## Casos pendientes de otros módulos

> Completar cuando los integrantes entreguen sus PRs (#9, #11).

### Búsqueda e indexación en archivos (Darwin — #8, mergeado ✅)

- `sequentialSearch` / `binarySearch` sobre arreglos de pacientes.
- `buildIndex` / `findByKey` sobre archivo NDJSON (solo Node.js,
  fuera del flujo del navegador).

### Benchmarking y estrés (Ricardo — #9, mergeado✅)
`stressTest`

## Comandos de verificación rápida

```bash
npm run dev      # levantar la app
npm run build    # tsc -b + vite build (typecheck + bundle)
npx vitest run   # suite completa de tests
npm run lint     # eslint
```

**Estado al 25/nov/2026:** `tsc -b` limpio · 80/80 tests ✅

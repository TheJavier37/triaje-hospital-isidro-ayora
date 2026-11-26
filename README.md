# Sistema de Triaje Automatizado de Urgencias Médicas

**Hospital Isidro Ayora - Loja, Ecuador**  
*Proyecto Integrador - Estructuras de Datos (Grupo 2)*

Prototipo interactivo para la gestión y re-categorización dinámica de pacientes en la sala de urgencias. Implementa un **Max-Heap** (O(\log n)) para el ranking de prioridad en tiempo real y una **Lista Enlazada Ordenada** para la trazabilidad e historial clínico, optimizando el consumo de memoria en el motor V8.

---

## 👥 Equipo de Trabajo (Grupo 2)

* Darwin Campoverde
* Javier Guarnizo
* Ricardo Ochoa
* Diyer Torres
* Mateo Yanangomez

---

## 🎯 Objetivos del Proyecto

* **Objetivo General:** Desarrollar un prototipo de triaje automatizado para el Hospital Isidro Ayora que organice dinámicamente la atención de pacientes en función de la severidad (Escala ESI) y la variabilidad de sus signos vitales mediante un Max-Heap.
* **Objetivos Específicos:**
  1. Diseñar e implementar una estructura de datos **Max-Heap** en TypeScript con métodos de flotación (`heapifyUp`) y hundimiento (`heapifyDown`) de complejidad O(\log n).
  2. Implementar una **Lista Enlazada Ordenada** para auditar el historial de pacientes atendidos, garantizando la desvinculación explícita de punteros para prevenir fugas de memoria (*memory leaks*).
  3. Crear una interfaz en React y Tailwind CSS que visualice el tiempo promedio de espera y emita alertas inmediatas ante variaciones térmicas, hemodinámicas o respiratorias.

---

## 🧩 Módulos del Proyecto

| Módulo | Ruta | Descripción |
|---|---|---|
| Max-Heap | `src/structures/MaxHeap.ts` | Cola de prioridad con `indexMap` para acceso O(1) y reordenamiento O(log n) |
| Lista Enlazada | `src/structures/LinkedList.ts` | Historial de atendidos con `findById`, `peekFirst/Last`, iterador |
| Hook de Triaje | `src/hooks/useTriageSystem.ts` | Puente entre estructuras puras y estado React; búsqueda y ordenamiento integrados |
| Ordenamiento | `src/algorithms/sorting.ts` | MergeSort y QuickSort multicriterio sobre `Patient[]` |
| Búsquedas | `src/algorithms/searching.ts` | Búsqueda secuencial y binaria genéricas |
| Indexación | `src/utils/fileIndexer.ts` | Índice NDJSON para búsquedas por archivo (solo Node.js) |
| Calculadora ESI | `src/utils/esiCalculator.ts` | `priorityScore` = peso ESI + penalización de signos vitales + bono de espera |
| Validadores | `src/utils/validators.ts` | Validación fisiológica de signos vitales |

---

## 🛠️ Arquitectura y Tecnologías

* **Lenguaje:** TypeScript ~6.0 (Tipado estricto)
* **Frontend Framework:** React 19 / Vite 8
* **Estilos:** Tailwind CSS v4
* **Testing:** Vitest + Testing Library (jsdom) — 80+ tests en `src/tests/`
* **Estructuras de Datos:** Max-Heap, LinkedList, MergeSort, QuickSort (implementación artesanal en TypeScript puro)

---

## 📜 Scripts disponibles

```bash
npm run dev           # Servidor de desarrollo (Vite)
npm run build         # Typecheck (tsc -b) + build de producción
npm run lint          # ESLint
npm run preview       # Preview del build
npm run benchmark:sort   # Benchmark de algoritmos de ordenamiento
npm run stress           # Suite de pruebas de estrés / data masiva
npx vitest run       # Suite completa de tests
```

---

## 📚 Documentación

* [`docs/GUIA_PRUEBAS.md`](docs/GUIA_PRUEBAS.md) — Casos de prueba funcionales paso a paso para la sustentación
* [`docs/CUADRO_COMPARATIVO.md`](docs/CUADRO_COMPARATIVO.md) — Cuadro comparativo de algoritmos y estructuras

---

## 📋 Prerrequisitos
* **Node.js**: v18.0.0 o superior
* **npm**: v9.0.0 o superior
* **Git** instalado en el sistema

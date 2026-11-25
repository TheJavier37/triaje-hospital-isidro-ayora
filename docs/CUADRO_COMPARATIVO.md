# Cuadro Comparativo Empírico — Búsqueda Secuencial vs. Binaria

**Sistema de Triaje Automatizado — Hospital Isidro Ayora · Issue #9 (Ricardo Ochoa)**

Generado automáticamente con `npm run stress` el 2026-11-25T11:55:34.573Z.
Entorno: Node v24.21.0 · linux/x64.

Metodología: dataset determinista (semilla 2026) con signos vitales y nivel ESI; claves de consulta
repartidas uniformemente (incluye el último elemento, peor caso). Memoria: 500 consultas × 5 rondas.
Archivo: 20 consultas secuenciales y 500 indexadas. Las comparaciones son el proxy de ciclos de CPU;
el tiempo de CPU se mide con `process.cpuUsage()`.

## En memoria (RAM)

| Registros | Secuencial (ms) | Binaria (ms) | Aceleración | Comp. secuencial | Comp. binaria | Ahorro de comparaciones | CPU sec. (ms) | CPU bin. (ms) | Ahorro de CPU |
|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 100 | 0.0004 | 0.0002 | 2.1x | 50 | 6.7 | 86.57 % | 0.0011 | 0.0004 | 66.43 % |
| 1.000 | 0.0070 | 0.0007 | 10.5x | 501 | 10.0 | 98.01 % | 0.0070 | 0.0014 | 80.65 % |
| 10.000 | 0.0604 | 0.0006 | 96.8x | 5010 | 13.3 | 99.73 % | 0.0604 | 0.0006 | 98.96 % |
| 50.000 | 0.6671 | 0.0013 | 528.8x | 25050 | 15.7 | 99.94 % | 0.6671 | 0.0018 | 99.73 % |

## En archivo NDJSON (índice binario + lectura por offset)

| Registros | Secuencial (ms) | Binaria (ms) | Aceleración | Comp. secuencial | Comp. binaria | Ahorro de comparaciones | CPU sec. (ms) | CPU bin. (ms) | Ahorro de CPU |
|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 100 | 0.8911 | 0.0309 | 28.8x | 53 | 6.7 | 87.19 % | 1.3050 | 0.0451 | 96.54 % |
| 1.000 | 2.9609 | 0.0243 | 121.7x | 525 | 10.0 | 98.10 % | 5.2761 | 0.0275 | 99.48 % |
| 10.000 | 12.0464 | 0.0205 | 588.1x | 5250 | 13.3 | 99.75 % | 14.4361 | 0.0230 | 99.84 % |
| 50.000 | 60.3273 | 0.0193 | 3124.5x | 26250 | 15.7 | 99.94 % | 67.0013 | 0.0220 | 99.97 % |

## Costo de construir el índice (una sola vez)

| Registros | Archivo de datos (MB) | Índice (KB) | Tiempo de construcción (ms) |
|---:|---:|---:|---:|
| 100 | 0.03 | 4.7 | 2.2 |
| 1.000 | 0.28 | 48.5 | 6.7 |
| 10.000 | 2.78 | 494.3 | 41.3 |
| 50.000 | 13.92 | 2501.9 | 274.5 |

## Conclusiones

- La búsqueda secuencial crece de forma **lineal O(n)**: al multiplicar los registros por 500 (100 → 50.000) el trabajo se multiplica en proporción similar.
- La búsqueda binaria crece de forma **logarítmica O(log n)**: pasa de unas 7 comparaciones (100 registros) a unas 16 (50.000).
- En archivo la ventaja es mayor, porque evita leer y parsear el archivo completo: solo consulta el índice y lee los bytes de un registro.
- La binaria exige datos ordenados (o un índice ordenado). El costo de ordenar o indexar se paga una vez y se amortiza cuando hay muchas consultas.
- Con pocos registros (≈100) en memoria la binaria hace menos comparaciones, pero la diferencia absoluta es de microsegundos y la sobrecarga constante del comparador puede igualarla o incluso superarla en tiempo; la binaria se justifica a partir de miles de registros.

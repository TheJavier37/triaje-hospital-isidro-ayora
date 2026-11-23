# Cuadro Comparativo Empírico — Búsqueda Secuencial vs. Binaria

**Sistema de Triaje Automatizado — Hospital Isidro Ayora · Issue #9 (Ricardo Ochoa)**

Generado automáticamente con `npm run stress` el 2026-11-22T17:37:49.390Z.
Entorno: Node v22.23.5 · linux/x64.

Metodología: dataset determinista (semilla 2026) con signos vitales y nivel ESI; claves de consulta
repartidas uniformemente (incluye el último elemento, peor caso). Memoria: 500 consultas × 5 rondas.
Archivo: 20 consultas secuenciales y 500 indexadas. Las comparaciones son el proxy de ciclos de CPU;
el tiempo de CPU se mide con `process.cpuUsage()`.

## En memoria (RAM)

| Registros | Secuencial (ms) | Binaria (ms) | Aceleración | Comp. secuencial | Comp. binaria | Ahorro de comparaciones | CPU sec. (ms) | CPU bin. (ms) | Ahorro de CPU |
|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 100 | 0.0006 | 0.0016 | 0.4x | 50 | 6.7 | 86.57 % | 0.0006 | 0.0016 | -172.81 % |
| 1.000 | 0.0071 | 0.0005 | 14.0x | 501 | 10.0 | 98.01 % | 0.0071 | 0.0005 | 92.81 % |
| 10.000 | 0.0560 | 0.0006 | 98.8x | 5010 | 13.3 | 99.73 % | 0.0549 | 0.0006 | 98.96 % |
| 50.000 | 0.7172 | 0.0008 | 888.8x | 25050 | 15.7 | 99.94 % | 0.7155 | 0.0008 | 99.89 % |

## En archivo NDJSON (índice binario + lectura por offset)

| Registros | Secuencial (ms) | Binaria (ms) | Aceleración | Comp. secuencial | Comp. binaria | Ahorro de comparaciones | CPU sec. (ms) | CPU bin. (ms) | Ahorro de CPU |
|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 100 | 1.0062 | 0.0325 | 31.0x | 53 | 6.7 | 87.19 % | 1.0067 | 0.0325 | 96.77 % |
| 1.000 | 5.1563 | 0.0261 | 197.2x | 525 | 10.0 | 98.10 % | 5.1460 | 0.0261 | 99.49 % |
| 10.000 | 14.8837 | 0.0212 | 702.7x | 5250 | 13.3 | 99.75 % | 14.6986 | 0.0209 | 99.86 % |
| 50.000 | 67.9370 | 0.0173 | 3923.9x | 26250 | 15.7 | 99.94 % | 67.6753 | 0.0173 | 99.97 % |

## Costo de construir el índice (una sola vez)

| Registros | Archivo de datos (MB) | Índice (KB) | Tiempo de construcción (ms) |
|---:|---:|---:|---:|
| 100 | 0.03 | 4.7 | 2.0 |
| 1.000 | 0.28 | 48.5 | 8.3 |
| 10.000 | 2.78 | 494.3 | 56.0 |
| 50.000 | 13.92 | 2501.9 | 169.1 |

## Conclusiones

- La búsqueda secuencial crece de forma **lineal O(n)**: al multiplicar los registros por 500 (100 → 50.000) el trabajo se multiplica en proporción similar.
- La búsqueda binaria crece de forma **logarítmica O(log n)**: pasa de unas 7 comparaciones (100 registros) a unas 16 (50.000).
- En archivo la ventaja es mayor, porque evita leer y parsear el archivo completo: solo consulta el índice y lee los bytes de un registro.
- La binaria exige datos ordenados (o un índice ordenado). El costo de ordenar o indexar se paga una vez y se amortiza cuando hay muchas consultas.
- Con pocos registros (≈100) en memoria la binaria hace menos comparaciones, pero la diferencia absoluta es de microsegundos y la sobrecarga constante del comparador puede igualarla o incluso superarla en tiempo; la binaria se justifica a partir de miles de registros.

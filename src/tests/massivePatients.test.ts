// Pruebas del generador de data masiva — issue #9 (Ricardo Ochoa)

import { describe, it, expect } from 'vitest';
import {
  MAX_MASSIVE_PATIENTS,
  STRESS_DATASET_SIZES,
  buildEcuadorianId,
  generateMassivePatients,
  sortPatientsById,
} from '../mock/massivePatients';
import { isValidEcuadorianId, validateVitalSigns } from '../utils/validators';
import { binarySearch, sequentialSearch } from '../algorithms/searching';

const NOW = new Date('2026-11-20T10:00:00Z');

describe('generateMassivePatients', () => {
  it.each(STRESS_DATASET_SIZES)('genera exactamente %i pacientes con ID único', (size) => {
    const patients = generateMassivePatients(size, { now: NOW });
    expect(patients).toHaveLength(size);
    expect(new Set(patients.map((p) => p.id)).size).toBe(size);
  });

  it('es determinista: misma semilla, mismo dataset', () => {
    const a = generateMassivePatients(500, { seed: 7, now: NOW });
    const b = generateMassivePatients(500, { seed: 7, now: NOW });
    expect(a).toEqual(b);
    expect(generateMassivePatients(500, { seed: 8, now: NOW })).not.toEqual(a);
  });

  it('todos los signos vitales son fisiológicamente válidos y el ESI está entre 1 y 5', () => {
    for (const p of generateMassivePatients(5_000, { now: NOW })) {
      expect(validateVitalSigns(p.vitalSigns).errors).toEqual({});
      expect([1, 2, 3, 4, 5]).toContain(p.esiLevel);
      expect(p.priorityScore).toBeGreaterThanOrEqual(100);
    }
  });

  it('respeta la distribución aproximada de ESI de un servicio de urgencias', () => {
    const patients = generateMassivePatients(10_000, { now: NOW });
    const share = (level: number) => patients.filter((p) => p.esiLevel === level).length / patients.length;
    expect(share(1)).toBeGreaterThan(0.03);
    expect(share(1)).toBeLessThan(0.08);
    expect(share(3)).toBeGreaterThan(0.3);
    expect(share(3)).toBeLessThan(0.4);
  });

  it('los pacientes críticos puntúan más que los estables', () => {
    const patients = generateMassivePatients(5_000, { now: NOW });
    const avg = (level: number) => {
      const group = patients.filter((p) => p.esiLevel === level);
      return group.reduce((sum, p) => sum + p.priorityScore, 0) / group.length;
    };
    expect(avg(1)).toBeGreaterThan(avg(2));
    expect(avg(2)).toBeGreaterThan(avg(3));
    expect(avg(3)).toBeGreaterThan(avg(4));
    expect(avg(4)).toBeGreaterThan(avg(5));
  });

  it('rechaza tamaños fuera de rango', () => {
    expect(() => generateMassivePatients(-1)).toThrow(RangeError);
    expect(() => generateMassivePatients(MAX_MASSIVE_PATIENTS + 1)).toThrow(RangeError);
  });
});

describe('cédulas y búsqueda sobre el dataset', () => {
  it('buildEcuadorianId genera cédulas válidas y distintas', () => {
    const ids = Array.from({ length: 2_000 }, (_, i) => buildEcuadorianId(i));
    expect(ids.every(isValidEcuadorianId)).toBe(true);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('búsqueda secuencial y binaria localizan al mismo paciente', () => {
    const patients = generateMassivePatients(1_000, { now: NOW });
    const sorted = sortPatientsById(patients);
    for (const target of [patients[0], patients[499], patients[999]]) {
      const seq = sequentialSearch(patients, target.id, (p) => p.id);
      const bin = binarySearch(sorted, target.id, (p) => p.id);
      expect(patients[seq].id).toBe(target.id);
      expect(sorted[bin].id).toBe(target.id);
    }
    expect(binarySearch(sorted, '0000000000', (p) => p.id)).toBe(-1);
  });
});

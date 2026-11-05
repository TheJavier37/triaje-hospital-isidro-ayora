import { describe, it, expect } from 'vitest';
import { calculateVitalSignsPenalty, calculatePriorityScore, gradualPenalty, VITAL_PENALTY_BANDS } from './esiCalculator';
import { MaxHeap } from '../structures/MaxHeap';
import type { Patient, VitalSigns } from '../types/triage';

const NORMAL: VitalSigns = {
  heartRate: 80, saturation: 98, systolicBP: 120, diastolicBP: 80, temperature: 36.5, respiratoryRate: 16,
};
const withSign = (key: keyof VitalSigns, value: number): VitalSigns => ({ ...NORMAL, [key]: value });
const range = (from: number, to: number, step: number) => {
  const out: number[] = [];
  const n = Math.round(Math.abs(to - from) / Math.abs(step));
  const dir = to >= from ? 1 : -1;
  for (let i = 0; i <= n; i++) out.push(Math.round((from + dir * i * Math.abs(step)) * 100) / 100);
  return out;
};

describe('Penalización gradual por signo vital', () => {
  it('signos normales no penalizan', () => {
    expect(calculateVitalSignsPenalty(NORMAL)).toBe(0);
  });

  // Para cada signo: valores que se alejan de lo normal por cada lado peligroso
  const casos: { key: keyof VitalSigns; alto?: number[]; bajo?: number[] }[] = [
    { key: 'heartRate', alto: range(100, 160, 1), bajo: range(50, 20, -1) },
    { key: 'saturation', bajo: range(94, 60, -1) },
    { key: 'systolicBP', alto: range(140, 220, 1), bajo: range(90, 40, -1) },
    { key: 'diastolicBP', alto: range(90, 140, 1), bajo: range(60, 20, -1) },
    { key: 'temperature', alto: range(38.0, 41.0, 0.1), bajo: range(36.0, 33.0, -0.1) },
    { key: 'respiratoryRate', alto: range(22, 40, 1), bajo: range(12, 2, -1) },
  ];

  for (const { key, alto, bajo } of casos) {
    for (const [lado, valores] of [['alto', alto], ['bajo', bajo]] as const) {
      if (!valores) continue;
      it(`${key} (${lado}): la penalización nunca baja al empeorar y llega al máximo`, () => {
        const penalties = valores.map((v) => gradualPenalty(v, VITAL_PENALTY_BANDS[key]));
        for (let i = 1; i < penalties.length; i++) {
          expect(penalties[i]).toBeGreaterThanOrEqual(penalties[i - 1]);
        }
        expect(penalties[0]).toBe(0);
        expect(penalties[penalties.length - 1]).toBe(VITAL_PENALTY_BANDS[key].maxPenalty);
      });
    }
  }

  it('no hay saltos bruscos: un cambio pequeño produce un cambio pequeño de penalización', () => {
    // Antes: pasar de FC 100 a 101 saltaba 75 puntos. Ahora debe ser menor a 10.
    const a = calculateVitalSignsPenalty(withSign('heartRate', 100));
    const b = calculateVitalSignsPenalty(withSign('heartRate', 101));
    expect(b - a).toBeGreaterThan(0);
    expect(b - a).toBeLessThan(10);

    // Saturación 94 -> 93 (antes saltaba 100 puntos)
    const c = calculateVitalSignsPenalty(withSign('saturation', 94));
    const d = calculateVitalSignsPenalty(withSign('saturation', 93));
    expect(d - c).toBeGreaterThan(0);
    expect(d - c).toBeLessThan(50);
  });

  it('al mejorar los signos la penalización baja (simétrico)', () => {
    const grave = calculateVitalSignsPenalty({ ...NORMAL, heartRate: 125, saturation: 90 });
    const medio = calculateVitalSignsPenalty({ ...NORMAL, heartRate: 110, saturation: 92 });
    const leve = calculateVitalSignsPenalty({ ...NORMAL, heartRate: 102, saturation: 94 });
    expect(grave).toBeGreaterThan(medio);
    expect(medio).toBeGreaterThan(leve);
    expect(leve).toBeGreaterThanOrEqual(0);
  });

  it('el valor crítico original sigue dando la penalización máxima original', () => {
    expect(calculateVitalSignsPenalty(withSign('heartRate', 130))).toBe(150);
    expect(calculateVitalSignsPenalty(withSign('heartRate', 40))).toBe(150);
    expect(calculateVitalSignsPenalty(withSign('saturation', 88))).toBe(200);
    expect(calculateVitalSignsPenalty(withSign('systolicBP', 180))).toBe(150);
    expect(calculateVitalSignsPenalty(withSign('temperature', 39.5))).toBe(100);
    expect(calculateVitalSignsPenalty(withSign('respiratoryRate', 30))).toBe(120);
  });

  it('más allá del valor crítico no sigue subiendo (el ESI base sigue mandando)', () => {
    expect(calculateVitalSignsPenalty(withSign('heartRate', 250))).toBe(150);
    expect(calculateVitalSignsPenalty(withSign('saturation', 40))).toBe(200);
  });

  it('el score de prioridad sube con el deterioro y baja con la mejoría', () => {
    const llegada = new Date();
    const scores = [80, 105, 115, 125, 135].map((hr) => calculatePriorityScore(3, withSign('heartRate', hr), llegada));
    for (let i = 1; i < scores.length; i++) expect(scores[i]).toBeGreaterThanOrEqual(scores[i - 1]);
    expect(scores[scores.length - 1]).toBeGreaterThan(scores[0]);
  });
});

describe('El Max-Heap se reordena al subir y bajar los signos vitales', () => {
  const crear = (id: string, esi: 1 | 2 | 3 | 4 | 5, vitals: VitalSigns): Patient => {
    const arrivalTime = new Date();
    return {
      id, fullName: `Paciente ${id}`, age: 40, esiLevel: esi, vitalSigns: vitals,
      priorityScore: calculatePriorityScore(esi, vitals, arrivalTime), arrivalTime, lastUpdated: arrivalTime,
    };
  };

  it('un paciente ESI 3 que se deteriora gradualmente pasa por delante de otro ESI 3 estable y vuelve atrás al estabilizarse', () => {
    const heap = new MaxHeap();
    heap.insert(crear('A', 3, NORMAL));
    heap.insert(crear('B', 3, NORMAL));
    heap.insert(crear('C', 3, NORMAL));

    const scoreDe = (v: VitalSigns) => calculatePriorityScore(3, v, heap.getPatients().find((p) => p.id === 'C')!.arrivalTime);
    const ahora = new Date();

    // Deterioro progresivo de C
    let ultimoScore = heap.getPatients().find((p) => p.id === 'C')!.priorityScore;
    for (const sat of [93, 92, 91, 90, 89]) {
      const nuevo = scoreDe(withSign('saturation', sat));
      expect(nuevo).toBeGreaterThan(ultimoScore); // cada paso suma puntos
      heap.updatePatientPriority('C', nuevo, ahora);
      ultimoScore = nuevo;
    }
    expect(heap.peek()?.id).toBe('C');

    // Estabilización de C
    const estable = scoreDe(NORMAL);
    heap.updatePatientPriority('C', estable, ahora);
    expect(heap.getPatients().find((p) => p.id === 'C')!.priorityScore).toBe(estable);
    expect(estable).toBeLessThan(ultimoScore);
  });
});

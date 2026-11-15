// Author: Darwin696

import { describe, it, expect, beforeEach } from 'vitest';
import { LinkedList, ListNode } from '../structures/LinkedList';
import type { EsiLevel, Patient } from '../types/triage';

const createMockPatient = (
  id: string,
  fullName = `Paciente ${id}`,
  esiLevel: EsiLevel = 3
): Patient => {
  const timestamp = new Date();

  return {
    id,
    fullName,
    age: 40,
    esiLevel,
    vitalSigns: {
      heartRate: 80,
      saturation: 98,
      systolicBP: 120,
      diastolicBP: 80,
      temperature: 36.7,
      respiratoryRate: 16,
    },
    priorityScore: 50,
    arrivalTime: timestamp,
    lastUpdated: timestamp,
  };
};

// Acceso a los punteros internos solo para auditar la memoria en los tests.
type ListInternals = {
  head: ListNode | null;
  tail: ListNode | null;
};

const internals = (list: LinkedList): ListInternals =>
  list as unknown as ListInternals;

describe('LinkedList - Historial de pacientes atendidos', () => {
  let list: LinkedList;

  beforeEach(() => {
    list = new LinkedList();
  });

  describe('estado inicial', () => {
    it('inicia vacía', () => {
      expect(list.size()).toBe(0);
      expect(list.isEmpty()).toBe(true);
      expect(list.toArray()).toEqual([]);
      expect(list.peekFirst()).toBeNull();
      expect(list.peekLast()).toBeNull();
    });
  });

  describe('append', () => {
    it('agrega un paciente y actualiza el tamaño', () => {
      list.append(createMockPatient('P1'));

      expect(list.size()).toBe(1);
      expect(list.isEmpty()).toBe(false);
    });

    it('conserva el orden de atención (más antiguo primero)', () => {
      list.append(createMockPatient('P1'));
      list.append(createMockPatient('P2'));
      list.append(createMockPatient('P3'));

      const ids = list.toArray().map(record => record.patient.id);

      expect(ids).toEqual(['P1', 'P2', 'P3']);
    });

    it('mantiene head y tail correctos tras varias inserciones', () => {
      list.append(createMockPatient('P1'));
      list.append(createMockPatient('P2'));

      expect(list.peekFirst()?.patient.id).toBe('P1');
      expect(list.peekLast()?.patient.id).toBe('P2');
      expect(internals(list).head?.next).toBe(internals(list).tail);
      expect(internals(list).tail?.next).toBeNull();
    });

    it('registra la hora de atención de cada nodo', () => {
      const before = Date.now();
      list.append(createMockPatient('P1'));
      const after = Date.now();

      const attendedAt = list.toArray()[0].attendedAt.getTime();

      expect(attendedAt).toBeGreaterThanOrEqual(before);
      expect(attendedAt).toBeLessThanOrEqual(after);
    });

    it('admite pacientes repetidos como registros independientes', () => {
      const patient = createMockPatient('P1');

      list.append(patient);
      list.append(patient);

      expect(list.size()).toBe(2);
    });
  });

  describe('toArray', () => {
    it('devuelve una copia: modificarla no altera la lista', () => {
      list.append(createMockPatient('P1'));

      const snapshot = list.toArray();
      snapshot.pop();

      expect(snapshot).toHaveLength(0);
      expect(list.size()).toBe(1);
      expect(list.toArray()).toHaveLength(1);
    });
  });

  describe('findById', () => {
    it('encuentra un paciente existente', () => {
      list.append(createMockPatient('P1', 'Ana Torres'));
      list.append(createMockPatient('P2', 'Luis Vega'));

      expect(list.findById('P2')?.patient.fullName).toBe('Luis Vega');
    });

    it('devuelve null si el paciente no está en el historial', () => {
      list.append(createMockPatient('P1'));

      expect(list.findById('NO-EXISTE')).toBeNull();
    });

    it('devuelve null en una lista vacía', () => {
      expect(list.findById('P1')).toBeNull();
    });
  });

  describe('removeFirst', () => {
    it('devuelve null si la lista está vacía', () => {
      expect(list.removeFirst()).toBeNull();
      expect(list.size()).toBe(0);
    });

    it('extrae los registros en orden FIFO', () => {
      list.append(createMockPatient('P1'));
      list.append(createMockPatient('P2'));

      expect(list.removeFirst()?.patient.id).toBe('P1');
      expect(list.size()).toBe(1);
      expect(list.removeFirst()?.patient.id).toBe('P2');
      expect(list.size()).toBe(0);
    });

    it('deja head y tail en null al extraer el último nodo', () => {
      list.append(createMockPatient('P1'));
      list.removeFirst();

      expect(internals(list).head).toBeNull();
      expect(internals(list).tail).toBeNull();
    });

    it('permite volver a insertar después de vaciarla', () => {
      list.append(createMockPatient('P1'));
      list.removeFirst();
      list.append(createMockPatient('P2'));

      expect(list.size()).toBe(1);
      expect(list.peekFirst()?.patient.id).toBe('P2');
      expect(list.peekLast()?.patient.id).toBe('P2');
    });

    it('desvincula el puntero next del nodo retirado', () => {
      list.append(createMockPatient('P1'));
      list.append(createMockPatient('P2'));

      const removedNode = internals(list).head as ListNode;
      list.removeFirst();

      expect(removedNode.next).toBeNull();
    });
  });

  describe('recorrido sin arreglos intermedios', () => {
    beforeEach(() => {
      list.append(createMockPatient('P1'));
      list.append(createMockPatient('P2'));
      list.append(createMockPatient('P3'));
    });

    it('forEach visita cada registro con su índice', () => {
      const visited: string[] = [];

      list.forEach((record, index) => {
        visited.push(`${index}:${record.patient.id}`);
      });

      expect(visited).toEqual(['0:P1', '1:P2', '2:P3']);
    });

    it('es iterable con for...of', () => {
      const ids: string[] = [];

      for (const record of list) {
        ids.push(record.patient.id);
      }

      expect(ids).toEqual(['P1', 'P2', 'P3']);
    });

    it('forEach no ejecuta el callback en una lista vacía', () => {
      let calls = 0;

      new LinkedList().forEach(() => {
        calls++;
      });

      expect(calls).toBe(0);
    });
  });

  describe('clear - prevención de fugas de memoria', () => {
    it('vacía la lista y reinicia el contador', () => {
      list.append(createMockPatient('P1'));
      list.append(createMockPatient('P2'));

      list.clear();

      expect(list.size()).toBe(0);
      expect(list.isEmpty()).toBe(true);
      expect(list.toArray()).toEqual([]);
      expect(internals(list).head).toBeNull();
      expect(internals(list).tail).toBeNull();
    });

    it('desvincula explícitamente todos los punteros next', () => {
      list.append(createMockPatient('P1'));
      list.append(createMockPatient('P2'));
      list.append(createMockPatient('P3'));

      // Se guardan los nodos antes de limpiar para verificar sus punteros.
      const nodes: ListNode[] = [];
      let current = internals(list).head;

      while (current !== null) {
        nodes.push(current);
        current = current.next;
      }

      list.clear();

      expect(nodes).toHaveLength(3);
      for (const node of nodes) {
        expect(node.next).toBeNull();
      }
    });

    it('es seguro llamarla sobre una lista vacía o varias veces', () => {
      expect(() => {
        list.clear();
        list.clear();
      }).not.toThrow();
      expect(list.size()).toBe(0);
    });

    it('la lista sigue siendo utilizable después de limpiarla', () => {
      list.append(createMockPatient('P1'));
      list.clear();
      list.append(createMockPatient('P2'));

      expect(list.size()).toBe(1);
      expect(list.toArray()[0].patient.id).toBe('P2');
    });
  });

  describe('volumen', () => {
    it('maneja 10 000 inserciones y limpieza sin perder consistencia', () => {
      const total = 10_000;

      for (let i = 0; i < total; i++) {
        list.append(createMockPatient(`P${i}`));
      }

      expect(list.size()).toBe(total);
      expect(list.peekFirst()?.patient.id).toBe('P0');
      expect(list.peekLast()?.patient.id).toBe(`P${total - 1}`);
      expect(list.toArray()).toHaveLength(total);

      list.clear();

      expect(list.size()).toBe(0);
    });
  });
});

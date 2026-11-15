// Author: TheJavier37

import type { Patient } from '../types/triage';

export class ListNode {
  public patient: Patient;
  public attendedAt: Date;
  public next: ListNode | null;

  constructor(patient: Patient, attendedAt: Date = new Date()) {
    this.patient = patient;
    this.attendedAt = attendedAt;
    this.next = null;
  }
}

/**
 * Lista enlazada simple con punteros `head` y `tail` para el historial de
 * pacientes atendidos.
 *
 * Auditoría de memoria (motor V8):
 * - `append` es O(1) gracias al puntero `tail` (sin recorrer la lista).
 * - Cada nodo solo retiene al paciente, la fecha y el puntero `next`; ningún
 *   otro objeto lo referencia, por lo que el recolector de basura puede
 *   liberarlo en cuanto la lista deja de apuntar a él.
 * - `removeFirst` y `clear` desvinculan explícitamente `next` para que los
 *   nodos descartados no queden encadenados entre sí (evita retener cadenas
 *   completas de nodos por una referencia olvidada).
 * - `forEach` y el iterador recorren la lista sin crear arreglos
 *   intermedios; `toArray` solo se usa cuando la interfaz necesita una copia.
 */
export class LinkedList {
  private head: ListNode | null;
  private tail: ListNode | null;
  private count: number;

  constructor() {
    this.head = null;
    this.tail = null;
    this.count = 0;
  }

  /** Agrega un paciente al final del historial. O(1). */
  public append(patient: Patient): void {
    const newNode = new ListNode(patient);

    if (this.tail === null) {
      this.head = newNode;
    } else {
      this.tail.next = newNode;
    }

    this.tail = newNode;
    this.count++;
  }

  /** Cantidad de nodos en la lista. O(1). */
  public size(): number {
    return this.count;
  }

  /** Indica si la lista no tiene nodos. O(1). */
  public isEmpty(): boolean {
    return this.count === 0;
  }

  /** Primer registro del historial, o null si está vacío. O(1). */
  public peekFirst(): { patient: Patient; attendedAt: Date } | null {
    if (this.head === null) return null;
    return { patient: this.head.patient, attendedAt: this.head.attendedAt };
  }

  /** Último registro del historial, o null si está vacío. O(1). */
  public peekLast(): { patient: Patient; attendedAt: Date } | null {
    if (this.tail === null) return null;
    return { patient: this.tail.patient, attendedAt: this.tail.attendedAt };
  }

  /**
   * Busca un paciente por id recorriendo la lista. O(n).
   *
   * @returns El registro encontrado o null si no existe.
   */
  public findById(
    patientId: string
  ): { patient: Patient; attendedAt: Date } | null {
    let current = this.head;

    while (current !== null) {
      if (current.patient.id === patientId) {
        return { patient: current.patient, attendedAt: current.attendedAt };
      }
      current = current.next;
    }

    return null;
  }

  /**
   * Elimina y devuelve el registro más antiguo del historial. O(1).
   * Desvincula el puntero del nodo retirado para liberar la cadena.
   */
  public removeFirst(): { patient: Patient; attendedAt: Date } | null {
    const removed = this.head;

    if (removed === null) return null;

    this.head = removed.next;
    removed.next = null;
    this.count--;

    if (this.head === null) {
      this.tail = null;
    }

    return { patient: removed.patient, attendedAt: removed.attendedAt };
  }

  /** Ejecuta un callback por cada registro sin crear arreglos temporales. */
  public forEach(
    callback: (
      record: { patient: Patient; attendedAt: Date },
      index: number
    ) => void
  ): void {
    let current = this.head;
    let index = 0;

    while (current !== null) {
      callback({ patient: current.patient, attendedAt: current.attendedAt }, index);
      current = current.next;
      index++;
    }
  }

  /** Iteración perezosa (`for...of`) sobre los registros del historial. */
  public *[Symbol.iterator](): IterableIterator<{
    patient: Patient;
    attendedAt: Date;
  }> {
    let current = this.head;

    while (current !== null) {
      yield { patient: current.patient, attendedAt: current.attendedAt };
      current = current.next;
    }
  }

  /** Copia del historial como arreglo, de más antiguo a más reciente. O(n). */
  public toArray(): { patient: Patient; attendedAt: Date }[] {
    const result: { patient: Patient; attendedAt: Date }[] = new Array(this.count);
    let current = this.head;
    let index = 0;

    while (current !== null) {
      result[index++] = {
        patient: current.patient,
        attendedAt: current.attendedAt,
      };
      current = current.next;
    }

    return result;
  }

  /** Vacía la lista desvinculando cada nodo para evitar fugas de memoria. */
  public clear(): void {
    let current = this.head;

    while (current !== null) {
      const nextNode = current.next;
      current.next = null;
      current = nextNode;
    }

    this.head = null;
    this.tail = null;
    this.count = 0;
  }
}

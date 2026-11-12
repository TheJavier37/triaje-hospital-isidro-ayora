// Author: TheJavier37

import type { Patient, VitalSigns } from '../types/triage';

export class MaxHeap {
  private heap: Patient[] = [];
  private indexMap: Map<string, number> = new Map();

  private getParentIndex(i: number): number {
    return Math.floor((i - 1) / 2);
  }

  private getLeftChildIndex(i: number): number {
    return 2 * i + 1;
  }

  private getRightChildIndex(i: number): number {
    return 2 * i + 2;
  }

  /**
   * Compara prioridad entre dos pacientes.
   * Si tienen el mismo priorityScore, prioriza al que llegó primero (FIFO clínico).
   */
  private hasHigherPriority(a: Patient, b: Patient): boolean {
    if (a.priorityScore !== b.priorityScore) {
      return a.priorityScore > b.priorityScore;
    }
    return a.arrivalTime.getTime() < b.arrivalTime.getTime();
  }

  private swap(i: number, j: number): void {
    const temp = this.heap[i];
    this.heap[i] = this.heap[j];
    this.heap[j] = temp;

    this.indexMap.set(this.heap[i].id, i);
    this.indexMap.set(this.heap[j].id, j);
  }

  /**
   * Flotación hacia la raíz: O(log n)
   */
  private heapifyUp(index: number): void {
    let currentIndex = index;

    while (currentIndex > 0) {
      const parentIndex = this.getParentIndex(currentIndex);
      if (this.hasHigherPriority(this.heap[currentIndex], this.heap[parentIndex])) {
        this.swap(currentIndex, parentIndex);
        currentIndex = parentIndex;
      } else {
        break;
      }
    }
  }

  /**
   * Hundimiento hacia las hojas: O(log n)
   */
  private heapifyDown(index: number): void {
    let currentIndex = index;
    const length = this.heap.length;

    while (true) {
      const leftIndex = this.getLeftChildIndex(currentIndex);
      const rightIndex = this.getRightChildIndex(currentIndex);
      let highestIndex = currentIndex;

      if (
        leftIndex < length &&
        this.hasHigherPriority(this.heap[leftIndex], this.heap[highestIndex])
      ) {
        highestIndex = leftIndex;
      }

      if (
        rightIndex < length &&
        this.hasHigherPriority(this.heap[rightIndex], this.heap[highestIndex])
      ) {
        highestIndex = rightIndex;
      }

      if (highestIndex !== currentIndex) {
        this.swap(currentIndex, highestIndex);
        currentIndex = highestIndex;
      } else {
        break;
      }
    }
  }

  /**
   * Inserta un paciente en la cola de prioridad: O(log n)
   */
  public insert(patient: Patient): void {
    if (this.indexMap.has(patient.id)) {
      this.updatePatientPriority(patient.id, patient.priorityScore, patient.vitalSigns);
      return;
    }

    this.heap.push(patient);
    const newIndex = this.heap.length - 1;
    this.indexMap.set(patient.id, newIndex);
    this.heapifyUp(newIndex);
  }

  /**
   * Extrae y devuelve al paciente con mayor priorityScore: O(log n)
   */
  public extractMax(): Patient | null {
    if (this.heap.length === 0) return null;

    if (this.heap.length === 1) {
      const onlyPatient = this.heap.pop()!;
      this.indexMap.delete(onlyPatient.id);
      return onlyPatient;
    }

    const maxPatient = this.heap[0];
    const lastPatient = this.heap.pop()!;

    this.indexMap.delete(maxPatient.id);
    this.heap[0] = lastPatient;
    this.indexMap.set(lastPatient.id, 0);

    this.heapifyDown(0);
    return maxPatient;
  }

  /**
   * Consulta directa al paciente más crítico sin extraerlo: O(1)
   */
  public peek(): Patient | null {
    return this.heap.length > 0 ? this.heap[0] : null;
  }

  /**
   * Re-categorización dinámica ante cambios en signos vitales: O(log n)
   * Localiza al paciente en O(1) mediante indexMap y reordena en O(log n).
   */
  public updatePatientPriority(
    patientId: string,
    newScore: number,
    updatedVitals?: VitalSigns
  ): boolean {
    const index = this.indexMap.get(patientId);
    if (index === undefined) return false;

    const currentPatient = this.heap[index];
    const oldScore = currentPatient.priorityScore;

    this.heap[index] = {
      ...currentPatient,
      priorityScore: newScore,
      vitalSigns: updatedVitals ?? currentPatient.vitalSigns,
      lastUpdated: new Date(),
    };

    if (newScore > oldScore) {
      this.heapifyUp(index);
    } else if (newScore < oldScore) {
      this.heapifyDown(index);
    }

    return true;
  }

  public size(): number {
    return this.heap.length;
  }

  public isEmpty(): boolean {
    return this.heap.length === 0;
  }

  public toArray(): Patient[] {
    return [...this.heap];
  }

  /**
   * Limpia la estructura liberando referencias para el Garbage Collector de V8
   */
  public clear(): void {
    this.indexMap.clear();
    this.heap.length = 0;
  }
}
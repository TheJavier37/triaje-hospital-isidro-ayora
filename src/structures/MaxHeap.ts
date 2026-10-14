// Author: TheJavier37

import type { Patient, ReorderAlert } from '../types/triage';

export class MaxHeap {
  private heap: Patient[];

  constructor() {
    this.heap = [];
  }

  public size(): number {
    return this.heap.length;
  }

  public isEmpty(): boolean {
    return this.heap.length === 0;
  }

  public peek(): Patient | null {
    return this.isEmpty() ? null : this.heap[0];
  }

  public getPatients(): Patient[] {
    return [...this.heap];
  }

  public insert(patient: Patient): void {
    this.heap.push(patient);
    this.heapifyUp(this.heap.length - 1);
  }

  public extractMax(): Patient | null {
    if (this.isEmpty()) return null;

    const max = this.heap[0];
    const end = this.heap.pop();

    if (this.heap.length > 0 && end !== undefined) {
      this.heap[0] = end;
      this.heapifyDown(0);
    }

    return max;
  }

  public updatePatientPriority(
    patientId: string,
    newScore: number,
    updatedAt: Date
  ): ReorderAlert | null {
    const index = this.heap.findIndex((p) => p.id === patientId);
    if (index === -1) return null;

    const patient = this.heap[index];
    const oldScore = patient.priorityScore;
    const oldPosition = index + 1;

    patient.priorityScore = newScore;
    patient.lastUpdated = updatedAt;

    let newIndex = index;

    if (newScore > oldScore) {
      newIndex = this.heapifyUp(index);
    } else if (newScore < oldScore) {
      newIndex = this.heapifyDown(index);
    }

    const newPosition = newIndex + 1;

    if (oldPosition !== newPosition) {
      return {
        patientId: patient.id,
        patientName: patient.fullName,
        previousPosition: oldPosition,
        newPosition: newPosition,
        reason:
          newPosition < oldPosition
            ? 'Deterioro de signos vitales (Prioridad Incrementada)'
            : 'Estabilización de signos vitales (Prioridad Reducida)',
        timestamp: updatedAt,
      };
    }

    return null;
  }

  private heapifyUp(index: number): number {
    let currentIndex = index;

    while (currentIndex > 0) {
      const parentIndex = Math.floor((currentIndex - 1) / 2);

      if (this.heap[currentIndex].priorityScore > this.heap[parentIndex].priorityScore) {
        this.swap(currentIndex, parentIndex);
        currentIndex = parentIndex;
      } else {
        break;
      }
    }

    return currentIndex;
  }

  private heapifyDown(index: number): number {
    let currentIndex = index;
    const length = this.heap.length;

    while (true) {
      let largest = currentIndex;
      const leftChild = 2 * currentIndex + 1;
      const rightChild = 2 * currentIndex + 2;

      if (
        leftChild < length &&
        this.heap[leftChild].priorityScore > this.heap[largest].priorityScore
      ) {
        largest = leftChild;
      }

      if (
        rightChild < length &&
        this.heap[rightChild].priorityScore > this.heap[largest].priorityScore
      ) {
        largest = rightChild;
      }

      if (largest !== currentIndex) {
        this.swap(currentIndex, largest);
        currentIndex = largest;
      } else {
        break;
      }
    }

    return currentIndex;
  }

  private swap(i: number, j: number): void {
    const temp = this.heap[i];
    this.heap[i] = this.heap[j];
    this.heap[j] = temp;
  }
}
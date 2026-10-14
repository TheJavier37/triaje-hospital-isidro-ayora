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

export class LinkedList {
  private head: ListNode | null;
  private tail: ListNode | null;
  private count: number;

  constructor() {
    this.head = null;
    this.tail = null;
    this.count = 0;
  }

  public append(patient: Patient): void {
    const newNode = new ListNode(patient);

    if (!this.head) {
      this.head = newNode;
      this.tail = newNode;
    } else if (this.tail) {
      this.tail.next = newNode;
      this.tail = newNode;
    }

    this.count++;
  }

  public size(): number {
    return this.count;
  }

  public toArray(): { patient: Patient; attendedAt: Date }[] {
    const result: { patient: Patient; attendedAt: Date }[] = [];
    let current = this.head;

    while (current !== null) {
      result.push({
        patient: current.patient,
        attendedAt: current.attendedAt,
      });
      current = current.next;
    }

    return result;
  }

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
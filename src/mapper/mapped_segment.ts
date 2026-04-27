import type { DataElement, Segment } from 'neat-edifact';

export default class MappedSegment {
  #segment: Segment;

  constructor(segment: Segment) {
    this.#segment = segment;
  }

  getDataElement(index: number): DataElement | undefined {}

  getValue(index: number): string | undefined {}

  toString(): string {}

  get segment(): Segment {
    return this.#segment;
  }
}

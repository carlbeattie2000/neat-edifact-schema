import type { DataElement, Segment } from 'neat-edifact';

export default class MappedSegment {
  public tag: string;

  public segment: Segment;

  constructor(segment: Segment) {
    this.tag = segment.tag;
    this.segment = segment;
  }

  getDataElement(index: number): DataElement | undefined {
    return this.segment.getDataElement(index);
  }

  getValue(index: number): string | undefined {
    return this.segment.getDataElement(index)?.Value;
  }
}

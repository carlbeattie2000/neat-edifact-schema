import type MappedSegment from './mapped_segment.js';

export default class MappedGroup {
  segments: Map<string, MappedSegment[]>;

  groups: Map<string, MappedGroup[]>;

  headSegment: MappedSegment;

  constructor(headSegment: MappedSegment) {
    this.segments = new Map();
    this.groups = new Map();
    this.headSegment = headSegment;
    this.addSegment(headSegment.tag, headSegment);
  }

  public addSegment(tag: string, mappedSegment: MappedSegment): void {
    if (this.segments.has(tag)) {
      this.segments.get(tag)?.push(mappedSegment);
    } else {
      this.segments.set(tag, [mappedSegment]);
    }
  }

  public addGroup(tag: string, mappedGroup: MappedGroup): void {
    if (this.groups.has(tag)) {
      this.groups.get(tag)?.push(mappedGroup);
    } else {
      this.groups.set(tag, [mappedGroup]);
    }
  }

  public getSegment(tag: string): MappedSegment | undefined {
    return this.segments.get(tag)?.[0];
  }

  public getSegments(tag: string): MappedSegment[] {
    return Array.from(this.segments.get(tag) ?? []);
  }

  public getGroup(tag: string): MappedGroup | undefined {
    return this.groups.get(tag)?.[0];
  }

  public getGroups(tag: string): MappedGroup[] {
    return Array.from(this.groups.get(tag) ?? []);
  }

  get head(): MappedSegment {
    return this.headSegment;
  }
}

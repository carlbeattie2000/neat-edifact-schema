import type { Segment } from 'neat-edifact';

import type MappedGroup from './mapped_group.js';
import type MappedSegment from './mapped_segment.js';

export default class MappedMessage {
  segments: Map<string, MappedSegment[]>;

  groups: Map<string, MappedGroup[]>;

  unkown: Segment[];

  constructor() {
    this.segments = new Map();
    this.groups = new Map();
    this.unkown = [];
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

  public addUnknown(segment: Segment): void {
    this.unknown.push(segment);
  }

  public replaceSegmentResult(tag: string, transformedValues: any[]): void {}

  public replaceGroupResults(tag: string, transformedValues: any[]): void {}

  public getSegment(tag: string): MappedSegment | undefined {
    return this.segments.get(tag)?.at(0);
  }

  public getSegments(tag: string): MappedSegment[] {
    return Array.from(this.segments.get(tag) ?? []);
  }

  public getAllSegments(): MappedSegment[] {
    return Array.from(this.segments.values().toArray().flat());
  }

  public getGroup(tag: string): MappedGroup | undefined {
    return this.groups.get(tag)?.at(0);
  }

  public getGroups(tag: string): MappedGroup[] {
    return Array.from(this.groups.get(tag) ?? []);
  }

  public getAllGroups(): MappedGroup[] {
    return Array.from(this.groups.values().toArray().flat());
  }

  get unknown(): Segment[] {
    return this.unkown;
  }
}

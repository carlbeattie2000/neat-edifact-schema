import type { Segment } from 'neat-edifact';

import type MappedGroup from './mapped_group.js';
import type MappedSegment from './mapped_segment.js';

export default class MappedMessage {
  #segments: Map<string, (MappedSegment | any)[]>;

  #groups: Map<string, MappedGroup[]>;

  #unknown: Segment[];

  constructor() {
    this.#segments = new Map();
    this.#groups = new Map();
    this.#unknown = [];
  }

  public addSegment(tag: string, mappedSegment: MappedSegment): void {}

  public addGroup(tag: string, mappedGroup: MappedGroup): void {}

  public addUnknown(segment: Segment): void {}

  public replaceSegmentResult(tag: string, transformedValues: any[]): void {}

  public replaceGroupResults(tag: string, transformedValues: any[]): void {}

  public getSegment(tag: string): MappedSegment | any | undefined {}

  public getSegments(tag: string): (MappedSegment | any)[] {}

  public getGroup(tag: string): MappedGroup | any | undefined {}

  public getGroups(tag: string): (MappedGroup | any)[] {}

  get unknown(): Segment[] {
    return this.#unknown;
  }
}

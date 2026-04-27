import type MappedSegment from './mapped_segment.js';

export default class MappedGroup {
  #segments: Map<string, (MappedSegment | unknown)[]>;

  #groups: Map<string, MappedGroup[]>;

  #headSegment: MappedSegment;

  constructor(headSegment: MappedSegment) {
    this.#segments = new Map();
    this.#groups = new Map();
    this.#headSegment = headSegment;
  }

  public addSegment(tag: string, mappedSegment: MappedSegment): void {}

  public addGroup(tag: string, mappedGroup: MappedGroup): void {}

  public replaceGroupResults(tag: string, transformedValues: any[]): void {}

  public getSegment(tag: string): MappedSegment | any | undefined {}

  public getSegments(tag: string): (MappedSegment | any)[] {}

  public getGroup(tag: string): MappedGroup | any | undefined {}

  public getGroups(tag: string): (MappedGroup | any)[] {}

  get headSegment(): MappedSegment {}
}

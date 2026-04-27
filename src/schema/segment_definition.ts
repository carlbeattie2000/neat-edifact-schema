import type { SegmentOptions } from './types.js';
import type MappedSegment from '../mapper/mapped_segment.js';

export default class SegmentDefinition {
  public tag: string;

  public required: boolean;

  public repeatable: number;

  public qualifier: string;

  public ignore: boolean;

  public transform: <T>(segment: MappedSegment) => T;

  static #defaultTransformFunction<T>(segment: MappedSegment): T {
    return segment as T;
  }

  constructor(tag: string, options?: SegmentOptions) {
    this.tag = tag;

    this.required = options?.required ?? false;

    this.repeatable = options?.repeatable ?? 1;

    this.qualifier = options?.qualifier ?? '';

    this.ignore = options?.ignore ?? false;

    this.transform = options?.transform ?? SegmentDefinition.#defaultTransformFunction;
  }
}

import type { HeadOptions } from './types.js';
import type MappedSegment from '../mapper/mapped_segment.js';

export default class HeadDefinition {
  public tag: string;

  public required: boolean;

  public qualifier: string;

  public ignore: boolean;

  public transform: <T>(segment: MappedSegment) => T;

  static #defaultTransformFunction<T>(segment: MappedSegment): T {
    return segment as T;
  }

  constructor(tag: string, options?: HeadOptions) {
    this.tag = tag;

    this.required = options?.required ?? false;

    this.qualifier = options?.qualifier ?? '';

    this.ignore = options?.ignore ?? false;

    this.transform = options?.transform ?? HeadDefinition.#defaultTransformFunction;
  }
}

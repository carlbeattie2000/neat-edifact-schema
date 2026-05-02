import type GroupDefinition from './definitions/group_definition.js';
import type SegmentDefinition from './definitions/segment_definition.js';
import type { DefineSchema } from './types.js';
import type MappedSegment from '../mapper/mapped/mapped_segment.js';

export default class EdifactSchema {
  public items: (SegmentDefinition | GroupDefinition)[];

  public transform: <T>(segment: MappedSegment) => T;

  public strict: boolean;

  static #defaultTransformFunction<T>(segment: MappedSegment): T {
    return segment as T;
  }

  constructor(options: DefineSchema) {
    this.items = options.items ?? [];

    this.transform = options?.transform ?? EdifactSchema.#defaultTransformFunction;

    this.strict = options.strict ?? false;
  }
}

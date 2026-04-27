import type GroupDefinition from './group_definition.js';
import type SegmentDefinition from './segment_definition.js';
import type { DefineSchema } from './types.js';
import type MappedSegment from '../mapper/mapped_segment.js';

export default class EdifactSchema {
  public segments: SegmentDefinition[];

  public groups: GroupDefinition[];

  public transform: <T>(segment: MappedSegment) => T;

  public strict: boolean;

  static #defaultTransformFunction<T>(segment: MappedSegment): T {
    return segment as T;
  }

  constructor(options: DefineSchema) {
    this.segments = options.segments ?? [];
    this.groups = options.groups ?? [];

    this.transform = options?.transform ?? EdifactSchema.#defaultTransformFunction;

    this.strict = options.strict ?? false;
  }
}

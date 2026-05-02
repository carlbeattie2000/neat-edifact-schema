import type { Segment } from 'neat-edifact';

import type HeadDefinition from '../head_definition.jsefinition.js';
import type SegmentDefinition from '../segment_definition.jsefinition.js';
import type { GroupOptions } from '../types.js';
import type MappedSegment from '../../mapper/mapped/mapped_segment.js';

export default class GroupDefinition {
  public tag: string;

  public required: boolean;

  public repeatable: number;

  public qualifier: string;

  public ignore: boolean;

  public transform: <T>(segment: MappedSegment) => T;

  static #defaultTransformFunction<T>(segment: MappedSegment): T {
    return segment as T;
  }

  public headDefinition: HeadDefinition;

  public definitions: (SegmentDefinition | GroupDefinition)[];

  constructor(tag: string, options?: GroupOptions) {
    if (!options?.head) {
      // need a definitions error
      throw new Error();
    }
    this.tag = tag;

    this.required = options?.required ?? false;

    this.repeatable = options?.repeatable ?? 1;

    this.qualifier = options?.qualifier ?? '';

    this.ignore = options?.ignore ?? false;

    this.transform = options?.transform ?? GroupDefinition.#defaultTransformFunction;

    this.headDefinition = options.head;
    this.definitions = options?.items ?? [];
  }

  public matchQualifier(segment: Segment): boolean {
    return this.headDefinition.matchQualifier(segment);
  }

  public match(segment: Segment): boolean {
    return this.headDefinition.match(segment);
  }
}

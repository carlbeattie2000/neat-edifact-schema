import GroupDefinition from './group_definition.js';
import HeadDefinition from './head_definition.js';
import EdifactSchema from './index.js';
import SegmentDefinition from './segment_definition.js';

import type {
  DefineSchema,
  GroupOptions,
  HeadOptions,
  SegmentOptions,
} from './types.js';

export function defineSchema(config: DefineSchema): EdifactSchema {
  return new EdifactSchema(config);
}

export function defineSegment(
  tag: string,
  options: SegmentOptions,
): SegmentDefinition {
  return new SegmentDefinition(tag, options);
}

export function defineHead(tag: string, options: HeadOptions): HeadDefinition {
  return new HeadDefinition(tag, options);
}

/**
 * @warning Do not include the head tag as a child segment within the same group's `definitions`.
 *          Doing so can cause greedy consumption where subsequent segments intended as
 *          new group repetitions are consumed as children of the current group.
 *
 *          If you need to have multiple segments with the same tag, use distinct
 *          qualifiers to differentiate them, or consider restructuring your schema.
 */
export function defineGroup(options: GroupOptions): GroupDefinition {
  return new GroupDefinition(options.head.tag, options);
}

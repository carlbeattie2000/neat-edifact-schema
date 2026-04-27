import GroupDefinition from './group_definition.js';
import EdifactSchema from './index.js';
import SegmentDefinition from './segment_definition.js';

import type { DefineSchema, GroupOptions, SegmentOptions } from './types.js';

export function defineSchema(config: DefineSchema): EdifactSchema {
  return new EdifactSchema(config);
}

export function segment(tag: string, options: SegmentOptions): SegmentDefinition {
  return new SegmentDefinition(tag, options);
}

export function group(tag: string, options: GroupOptions): GroupDefinition {
  return new GroupDefinition(tag, options);
}

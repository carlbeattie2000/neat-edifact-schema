import type GroupDefinition from './group_definition.js';
import type HeadDefinition from './head_definition.js';
import type SegmentDefinition from './segment_definition.js';
import type MappedSegment from '../mapper/mapped_segment.js';

export interface SegmentOptions {
  required?: boolean;

  repeatable?: number;

  qualifier?: string;

  ignore?: boolean;

  transform?: <T>(segment: MappedSegment) => T;
}

export interface HeadOptions {
  required?: boolean;

  qualifier?: string;

  ignore?: boolean;

  transform?: <T>(segment: MappedSegment) => T;
}

export interface GroupOptions extends SegmentOptions {
  head: HeadDefinition;
  items?: (SegmentDefinition | GroupDefinition)[];
}

export interface DefineSchema {
  items?: (SegmentDefinition | GroupDefinition)[];

  transform?: <T>(segment: MappedSegment) => T;

  strict?: boolean;
}

import type GroupDefinition from './group_definition.js';
import type SegmentDefinition from './segment_definition.js';
import type MappedSegment from '../mapper/mapped_segment.js';

export interface SegmentOptions {
  required?: boolean;

  repeatable?: number;

  qualifier?: string;

  ignore?: boolean;

  transform?: <T>(segment: MappedSegment) => T;
}

export interface GroupOptions extends SegmentOptions {
  segments?: SegmentDefinition[];

  groups?: GroupDefinition[];
}

export interface DefineSchema {
  segments?: SegmentDefinition[];

  groups?: GroupDefinition[];

  transform?: <T>(segment: MappedSegment) => T;
}

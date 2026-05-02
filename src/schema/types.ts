import type GroupDefinition from './definitions/group_definition.js';
import type HeadDefinition from './definitions/head_definition.js';
import type SegmentDefinition from './definitions/segment_definition.js';

export interface SegmentOptions {
  required?: boolean;

  repeatable?: number;

  qualifier?: string;

  ignore?: boolean;
}

export interface HeadOptions {
  required?: boolean;

  qualifier?: string;

  ignore?: boolean;
}

export interface GroupOptions extends SegmentOptions {
  head: HeadDefinition;
  items?: (SegmentDefinition | GroupDefinition)[];
}

export interface DefineSchema {
  items?: (SegmentDefinition | GroupDefinition)[];

  strict?: boolean;
}

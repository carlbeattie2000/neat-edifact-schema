import type MappedGroup from './mapped/mapped_group.js';
import type MappedMessage from './mapped/mapped_message.js';
import type MappedSegment from './mapped/mapped_segment.js';
import type GroupDefinition from '../schema/definitions/group_definition.js';
import type HeadDefinition from '../schema/definitions/head_definition.js';
import type SegmentDefinition from '../schema/definitions/segment_definition.js';

export type Definition = SegmentDefinition | GroupDefinition | HeadDefinition;
export type Store = MappedMessage | MappedGroup;
export type MessageItem = MappedSegment | MappedGroup;

export enum ConsumeOption {
  NO_INCREMENTS = 'NO_INCREMENTS',
}

import type MappedSegment from '../mapper/mapped/mapped_segment.js';

export type SegmentTransform<T> = (segment: MappedSegment) => T;

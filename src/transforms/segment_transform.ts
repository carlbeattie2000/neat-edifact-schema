import type MappedSegment from '../mapper/mapped_segment.js';

export type SegmentTransform<T> = (segment: MappedSegment) => T;

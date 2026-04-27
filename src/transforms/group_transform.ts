import type MappedGroup from '../mapper/mapped_group.js';

export type GroupTransform<T> = (group: MappedGroup) => T;

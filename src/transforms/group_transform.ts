import type MappedGroup from '../mapper/mapped/mapped_group.js';

export type GroupTransform<T> = (group: MappedGroup) => T;

import SegmentDefinition from './segment_definition.js';

import type { GroupOptions } from './types.js';

export default class GroupDefinition extends SegmentDefinition {
  public segments: SegmentDefinition[];

  public groups: GroupDefinition[];

  constructor(tag: string, options?: GroupOptions) {
    super(tag, options);

    this.segments = options?.segments ?? [];

    this.groups = options?.groups ?? [];
  }
}

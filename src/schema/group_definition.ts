import SegmentDefinition from './segment_definition.js';

import type { GroupOptions } from './types.js';

export default class GroupDefinition extends SegmentDefinition {
  public items: (SegmentDefinition | GroupDefinition)[];

  constructor(tag: string, options?: GroupOptions) {
    super(tag, options);

    this.items = options?.items ?? [];
  }
}

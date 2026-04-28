import type HeadDefinition from './head_definition.js';
import SegmentDefinition from './segment_definition.js';

import type { GroupOptions } from './types.js';

export default class GroupDefinition extends SegmentDefinition {
  public headDefinition: HeadDefinition;
  public definitions: (SegmentDefinition | GroupDefinition)[];

  constructor(tag: string, options?: GroupOptions) {
    if (!options?.head) {
      // need a definitions error
      throw new Error();
    }
    super(tag, options);

    this.headDefinition = options.head;
    this.definitions = options?.items ?? [];
  }
}

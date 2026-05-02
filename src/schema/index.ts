import type GroupDefinition from './definitions/group_definition.js';
import type SegmentDefinition from './definitions/segment_definition.js';
import type { DefineSchema } from './types.js';

export default class EdifactSchema {
  public items: (SegmentDefinition | GroupDefinition)[];

  public strict: boolean;

  constructor(options: DefineSchema) {
    this.items = options.items ?? [];

    this.strict = options.strict ?? false;
  }
}

import type { MapperOptions } from './mapper_options.js';
import type EdifactSchema from '../schema/index.js';
import type { Message, Segment } from 'neat-edifact';
import type MappedMessage from './mapped_message.js';
import type SegmentDefinition from '../schema/segment_definition.js';
import type GroupDefinition from '../schema/group_definition.js';
import SchemaOutOfOrderError from '../errors/SchemaOutOfOrderError.js';

export default class Mapper {
  #schema: EdifactSchema;
  #options: MapperOptions;

  constructor(schema: EdifactSchema, options?: MapperOptions) {
    this.#schema = schema;

    this.#options = {
      strict: options?.strict ?? false,
      trimValues: options?.trimValues ?? false,
      caseInsensitiveQualifiers: options?.caseInsensitiveQualifiers ?? false,
      maxScanDistance: options?.maxScanDistance ?? 1000,
    };
  }

  private matchQualifier(
    schemaQualifier: string,
    segmentQualifier?: string,
  ): boolean {
    if (!segmentQualifier || schemaQualifier !== segmentQualifier) {
      if (this.#schema.strict) {
        throw new SchemaOutOfOrderError();
      }

      return false;
    }

    return true;
  }

  private matches(
    item: SegmentDefinition | GroupDefinition,
    segment: Segment,
  ): boolean {
    const segmentQualifier = segment.getDataElement(0);
    const { tag } = segment;

    if (tag === item.tag) {
      if (item.qualifier) {
        return this.matchQualifier(item.qualifier, segmentQualifier?.Value);
      }
    }
  }

  public map(message: Message): MappedMessage {
    let cursor = 0;
    this.#schema.items.forEach((schemaItem) => {
      if (cursor >= message.segments.length) {
        if (this.#options.strict && schemaItem.required) {
          throw new Error();
        }
      }

      const seg = message.segments[cursor];
    });
  }
}

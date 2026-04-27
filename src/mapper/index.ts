import type { MapperOptions } from './mapper_options.js';
import type EdifactSchema from '../schema/index.js';
import type { Message } from 'neat-edifact';
import type MappedMessage from './mapped_message.js';

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

  public map(message: Message): MappedMessage {
  }
}

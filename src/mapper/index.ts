import NonStrictMapper from './nonStrict/index.js';
import StrictMapper from './strict_mapper.js';

import type { Message } from 'neat-edifact';

import type MappedMessage from './mapped_message.js';
import type EdifactSchema from '../schema/index.js';

export default class Mapper {
  #schema: EdifactSchema;

  constructor(schema: EdifactSchema) {
    this.#schema = schema;
  }

  public map(message: Message): MappedMessage {
    if (this.#schema.strict) {
      const strictMapper = new StrictMapper(this.#schema);
      return strictMapper.map(message);
    }
    return new NonStrictMapper(this.#schema).map(message);
  }
}

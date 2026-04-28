import type { Message } from 'neat-edifact';
import type EdifactSchema from '../schema/index.js';
import type MappedMessage from './mapped_message.js';
import StrictMapper from './strict_mapper.js';

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
    throw new Error('Not Implemented');
  }
}

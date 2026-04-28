import type { Message } from 'neat-edifact';
import SchemaOutOfOrderError from '../errors/SchemaOutOfOrderError.js';
import EdifactSchema from '../schema/index.js';
import SegmentDefinition from '../schema/segment_definition.js';
import Cursor from './cursor.js';
import MappedGroup from './mapped_group.js';
import MappedMessage from './mapped_message.js';
import MappedSegment from './mapped_segment.js';
import type { Definition, Store } from './types.js';
import { isExactInstanceOf } from '../utils/is_exact_instance.js';
import GroupDefinition from '../schema/group_definition.js';
import SchemaMissingSegmentError from '../errors/SchemaMissingSegmentError.js';
import SchemaRepeatLimitError from '../errors/SchemaRepeatLimitError.js';
import SchemaMissingGroupError from '../errors/SchemaMissingGroupError.js';
import SchemaExtraSegmentError from '../errors/SchemaExtraSegmentError.js';
import type HeadDefinition from '../schema/head_definition.js';

const ZERO = 0;

export default class StrictMapper {
  #schema: EdifactSchema;
  #rootMessage: MappedMessage;
  #cursor: Cursor;
  #mapped: boolean;

  constructor(schema: EdifactSchema) {
    this.#schema = schema;
    this.#rootMessage = new MappedMessage();
    this.#cursor = new Cursor([]);
    this.#mapped = false;
  }

  private matchHead(definition: Definition): boolean {
    if (!this.#cursor.segment) {
      return false;
    }
    return this.#cursor.segment.tag === definition.tag;
  }

  private matchQualifier(
    definition: Definition,
    silent: boolean = false,
  ): boolean {
    if (!definition.qualifier) {
      return true;
    }

    const qualifier = this.#cursor?.segment?.getDataElement(0);

    if (!qualifier || definition.qualifier !== qualifier.Value) {
      if (silent) {
        return false;
      }
      throw new SchemaOutOfOrderError();
    }

    return true;
  }

  private match(definition: Definition): boolean {
    if (!this.#cursor.segment) {
      throw new SchemaOutOfOrderError();
    }

    if (this.#cursor.segment.tag !== definition.tag) {
      throw new SchemaOutOfOrderError();
    }

    return this.matchQualifier(definition);
  }

  private freeze() {
    this.#mapped = true;
    this.#cursor = new Cursor([]);
    this.#schema = new EdifactSchema({});
    Object.freeze(this);
  }

  private handle(definition: Definition, store: Store) {
  }

  public map(message: Message): MappedMessage {
    if (this.#mapped) {
      return this.#rootMessage;
    }

    this.#cursor = new Cursor(message.segments);

    this.#schema.items.forEach((definition) => {
      if (this.#cursor.current >= this.#cursor.segments.length) {
        if (definition.required) {
          throw new SchemaOutOfOrderError();
        }
        return;
      }
    });

    if (this.#cursor.current < this.#cursor.segments.length) {
      throw new SchemaExtraSegmentError();
    }

    this.freeze();

    return this.#rootMessage;
  }
}

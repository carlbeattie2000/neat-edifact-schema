import Cursor from '../cursor/cursor.js';
import MappedGroup from '../mapped/mapped_group.js';
import MappedMessage from '../mapped/mapped_message.js';
import MappedSegment from '../mapped/mapped_segment.js';
import {
  ConsumeOption,

} from '../types.js';
import SchemaExtraSegmentError from '../../errors/SchemaExtraSegmentError.js';
import SchemaMissingGroupError from '../../errors/SchemaMissingGroupError.js';
import SchemaMissingSegmentError from '../../errors/SchemaMissingSegmentError.js';
import SchemaOutOfOrderError from '../../errors/SchemaOutOfOrderError.js';
import SchemaRepeatLimitError from '../../errors/SchemaRepeatLimitError.js';
import GroupDefinition from '../../schema/definitions/group_definition.js';
import HeadDefinition from '../../schema/definitions/head_definition.js';
import EdifactSchema from '../../schema/index.js';
import SegmentDefinition from '../../schema/definitions/segment_definition.js';
import { isZero } from '../../utils.js';

import type { Message } from 'neat-edifact';

import type { Definition, MessageItem, Store } from '../types.js';

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
    silent = false,
  ): boolean {
    if (!definition.qualifier) {
      return true;
    }

    const qualifier = this.#cursor?.segment?.getDataElement(0);

    if (definition.qualifier !== qualifier?.Value) {
      if (silent) {
        return false;
      }
      throw new SchemaOutOfOrderError();
    }

    return true;
  }

  private match(definition: Definition): boolean {
    if (!this.#cursor.segment) {
      throw new SchemaMissingSegmentError();
    }

    if (this.#cursor.segment.tag !== definition.tag) {
      throw new SchemaOutOfOrderError();
    }

    return this.matchQualifier(definition);
  }

  private consume(item: MessageItem, store?: Store, option?: ConsumeOption) {
    const localStore = store ?? this.#rootMessage;

    if (item instanceof MappedSegment) {
      localStore.addSegment(item.tag, item);
    }

    if (item instanceof MappedGroup) {
      localStore.addGroup(item.head.tag, item);
    }

    if (ConsumeOption.NO_INCREMENTS === option) {
      return;
    }

    this.#cursor.next();
  }

  private freeze() {
    this.#mapped = true;
    this.#cursor = new Cursor([]);
    this.#schema = new EdifactSchema({});
    Object.freeze(this);
  }

  private handle(definition: Definition, store?: Store) {
    const localStore = store ?? this.#rootMessage;

    if (definition instanceof SegmentDefinition) {
      let counted = 0;

      if (this.#cursor.segment && this.#cursor.segment.tag !== definition.tag) {
        throw new SchemaOutOfOrderError();
      }

      while (this.matchHead(definition)) {
        if (this.match(definition) && this.#cursor.segment) {
          this.consume(new MappedSegment(this.#cursor.segment), localStore);
          counted += 1;

          if (!this.matchQualifier(definition, true)) {
            break;
          }
        }
      }

      if (definition.required && isZero(counted)) {
        throw new SchemaMissingSegmentError();
      }

      if (counted > definition.repeatable) {
        throw new SchemaRepeatLimitError(
          definition.tag,
          definition.repeatable,
          counted,
        );
      }
    }

    if (definition instanceof GroupDefinition) {
      let counted = 0;

      while (this.matchHead(definition) && this.#cursor.segment) {
        const mappedGroup = new MappedGroup(
          new MappedSegment(this.#cursor.segment),
        );
        this.handle(definition.headDefinition, mappedGroup);
        definition.definitions.forEach((childDefinition) => {
          this.handle(childDefinition, mappedGroup);
        });
        this.consume(mappedGroup, localStore, ConsumeOption.NO_INCREMENTS);
        counted += 1;
      }

      if (definition.required && isZero(counted)) {
        throw new SchemaMissingGroupError(definition.tag);
      }

      if (counted > definition.repeatable) {
        throw new SchemaRepeatLimitError(
          definition.tag,
          definition.repeatable,
          counted,
        );
      }
    }

    if (definition instanceof HeadDefinition) {
      if (this.match(definition) && this.#cursor.segment) {
        this.consume(new MappedSegment(this.#cursor.segment), localStore);
      }
    }
  }

  public map(message: Message): MappedMessage {
    if (this.#mapped) {
      return this.#rootMessage;
    }

    this.#cursor = new Cursor(message.segments);

    this.#schema.items.forEach((definition) => {
      if (this.#cursor.current >= this.#cursor.segments.length) {
        if (definition.required) {
          throw new SchemaMissingSegmentError();
        }
        return;
      }

      this.handle(definition);
    });

    if (this.#cursor.current < this.#cursor.segments.length) {
      throw new SchemaExtraSegmentError();
    }

    this.freeze();

    return this.#rootMessage;
  }
}

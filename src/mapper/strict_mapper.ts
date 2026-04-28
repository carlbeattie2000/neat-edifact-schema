import type { Message } from 'neat-edifact';
import SchemaOutOfOrderError from '../errors/SchemaOutOfOrderError.js';
import EdifactSchema from '../schema/index.js';
import SegmentDefinition from '../schema/segment_definition.js';
import Cursor from './cursor.js';
import MappedGroup from './mapped_group.js';
import MappedMessage from './mapped_message.js';
import MappedSegment from './mapped_segment.js';
import type { SchemaItem } from './types.js';
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

  private matchHead(definition: SchemaItem | HeadDefinition): boolean {
    if (!this.#cursor.segment) {
      return false;
    }
    return this.#cursor.segment.tag === definition.tag;
  }

  private matchQualifier(
    definition: SchemaItem | HeadDefinition,
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

  private match(definition: SchemaItem): boolean {
    if (!this.#cursor.segment) {
      throw new SchemaOutOfOrderError();
    }

    if (this.#cursor.segment.tag !== definition.tag) {
      throw new SchemaOutOfOrderError();
    }

    return this.matchQualifier(definition);
  }

  private consumeSegment(
    mappedSegment: MappedSegment,
    store?: MappedMessage | MappedGroup,
  ): void {
    if (store) {
      store.addSegment(mappedSegment.segment.tag, mappedSegment);
    } else {
      this.#rootMessage.addSegment(mappedSegment.segment.tag, mappedSegment);
    }
  }

  private consumeGroup(
    mappedGroup: MappedGroup,
    store?: MappedMessage | MappedGroup,
  ): void {
    if (store) {
      store.addGroup(mappedGroup.head.tag, mappedGroup);
    } else {
      this.#rootMessage.addGroup(mappedGroup.head.tag, mappedGroup);
    }
  }

  private consume(
    mappedSegment: MappedSegment | MappedGroup,
    store?: MappedMessage | MappedGroup,
  ): void {
    if (mappedSegment instanceof MappedSegment) {
      this.consumeSegment(mappedSegment, store);
    } else {
      this.consumeGroup(mappedSegment, store);
    }
  }

  private mapSegment(definition: SegmentDefinition): MappedSegment | undefined {
    if (this.match(definition) && this.#cursor.segment) {
      return new MappedSegment(this.#cursor.segment);
    }
    return undefined;
  }

  private handleSegmentDefinition(
    definition: SegmentDefinition,
    store?: MappedMessage | MappedGroup,
  ) {
    let counted = 0;

    while (this.matchHead(definition)) {
      const mappedSegment = this.mapSegment(definition);

      if (mappedSegment) {
        this.consume(mappedSegment, store);
        counted++;

        if (!this.matchQualifier(definition, true)) {
          break;
        }
      }
    }

    if (definition.required && counted === ZERO) {
      throw new SchemaMissingSegmentError(definition.tag);
    }

    if (counted > definition.repeatable) {
      throw new SchemaRepeatLimitError(
        definition.tag,
        definition.repeatable,
        counted,
      );
    }
  }

  private handleGroupHeadDefinition(
    definition: HeadDefinition,
  ): MappedGroup | undefined {
    if (!this.#cursor.segment || !this.matchHead(definition)) {
      throw new SchemaMissingGroupError(definition.tag);
    }

    if (definition.qualifier) {
      this.matchQualifier(definition);
    }

    const mappedHead = new MappedSegment(this.#cursor.segment);
    const mappedGroup = new MappedGroup(mappedHead);

    return mappedGroup;
  }

  private mapGroup(definition: GroupDefinition): MappedGroup | undefined {
    const mappedGroup = this.handleGroupHeadDefinition(definition);

    if (!mappedGroup) {
      return undefined;
    }

    definition.definitions.forEach((childDefinition) => {
      if (isExactInstanceOf(childDefinition, SegmentDefinition)) {
        this.handleSegmentDefinition(childDefinition, mappedGroup);
      }

      if (
        isExactInstanceOf(childDefinition, GroupDefinition) &&
        childDefinition instanceof GroupDefinition
      ) {
        this.handleGroupDefinition(childDefinition, mappedGroup);
      }
    });

    return mappedGroup;
  }

  private handleGroupDefinition(
    definition: GroupDefinition,
    store?: MappedGroup,
  ) {
    let counted = 0;

    while (this.matchHead(definition)) {
      const mappedGroup = this.mapGroup(definition);

      if (mappedGroup) {
        this.consume(mappedGroup, store);
        counted++;

        if (!this.matchQualifier(definition, true)) {
          break;
        }
      }
    }

    if (definition.required && counted === ZERO) {
      throw new SchemaMissingSegmentError(definition.tag);
    }

    if (counted > definition.repeatable) {
      throw new SchemaRepeatLimitError(
        definition.tag,
        definition.repeatable,
        counted,
      );
    }
  }

  private freeze() {
    this.#mapped = true;
    this.#cursor = new Cursor([]);
    this.#schema = new EdifactSchema({});
    Object.freeze(this);
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

      if (
        isExactInstanceOf(definition, SegmentDefinition) &&
        definition instanceof SegmentDefinition
      ) {
        return this.handleSegmentDefinition(definition);
      }

      if (
        isExactInstanceOf(definition, GroupDefinition) &&
        definition instanceof GroupDefinition
      ) {
        return this.handleGroupDefinition(definition);
      }
    });

    if (this.#cursor.current < this.#cursor.segments.length) {
      throw new SchemaExtraSegmentError();
    }

    this.freeze();

    return this.#rootMessage;
  }
}

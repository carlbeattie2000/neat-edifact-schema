import GroupDefinition from '../../schema/definitions/group_definition.js';
import SegmentDefinition from '../../schema/definitions/segment_definition.js';
import MappedMessage from '../mapped/mapped_message.js';
import SegmentIndexStore from './segments_store.js';
import { forEachRange } from '../../utils.js';
import MappedGroup from '../mapped/mapped_group.js';
import MappedSegment from '../mapped/mapped_segment.js';

import type { Message, Segment } from 'neat-edifact';

import type EdifactSchema from '../../schema/index.js';
import type { Store } from '../types.js';

type ParentBounds = [number, number];

interface BuildMappedGroupOptions {
  store?: Store;
  parentBounds?: ParentBounds;
}

export default class NonStrictMapper {
  #schema: EdifactSchema;

  #rootMessage: MappedMessage;

  #consumedIndices: SegmentIndexStore;

  constructor(schema: EdifactSchema) {
    this.#schema = schema;
    this.#rootMessage = new MappedMessage();
    this.#consumedIndices = new SegmentIndexStore();
  }

  #findMostLikelyGroupEnd(definition: GroupDefinition, segments: Segment[], start: number): number {
    for (let i = start + 1; i < segments.length; i += 1) {
      const segment = segments[i];

      if (segment) {
        if (!this.#consumedIndices.has(i) && definition.match(segment)) {
          return i;
        }
      }
    }

    return segments.length - 1;
  }

  #buildMappedGroup(
    definition: GroupDefinition,
    segments: Segment[],
    start: number,
    end: number,
    opt?: BuildMappedGroupOptions,
  ) {
    const headSegment = segments[start];

    if (!headSegment) {
      return;
    }

    const mappedHeadSegment = new MappedSegment(headSegment);
    const mappedGroup = new MappedGroup(mappedHeadSegment);

    this.#consumedIndices.add(start);

    const definitionChildGroupDefinitions = definition.definitions.filter(
      (childDefinition) => childDefinition instanceof GroupDefinition,
    );

    definitionChildGroupDefinitions.forEach((childDefinition) => {
      forEachRange(segments, start + 1, end, (segment, i) => {
        if (!this.#consumedIndices.has(i) && childDefinition.match(segment)) {
          const childStart = i;
          const childEnd = this.#findMostLikelyGroupEnd(childDefinition, segments, childStart);

          this.#buildMappedGroup(childDefinition, segments, childStart, childEnd, {
            store: mappedGroup,
            parentBounds: opt?.parentBounds ?? [start, end],
          });
        }
      });
    });

    const definitionChildSegmentDefinitions = definition.definitions.filter(
      (childDefinition) => childDefinition instanceof SegmentDefinition,
    );
    const segmentSearchBounds = opt?.parentBounds ?? [start, end];

    definitionChildSegmentDefinitions.forEach((childDefinition) => {
      forEachRange(segments, segmentSearchBounds[0], segmentSearchBounds[1], (segment, i) => {
        if (!this.#consumedIndices.has(i) && childDefinition.match(segment)) {
          const mappedSegment = new MappedSegment(segment);
          mappedGroup.addSegment(mappedSegment.tag, mappedSegment);
          this.#consumedIndices.add(i);
        }
      });
    });

    if (opt?.store) {
      opt.store.addGroup(mappedGroup.head.tag, mappedGroup);
    } else {
      this.#rootMessage.addGroup(mappedGroup.head.tag, mappedGroup);
    }
  }

  public map(message: Message): MappedMessage {
    const { segments } = message;

    const groupDefinitions = this.#schema.items.filter(
      (definition) => definition instanceof GroupDefinition,
    );

    groupDefinitions.forEach((defintion) => {
      segments.forEach((segment, i) => {
        if (!this.#consumedIndices.has(i) && defintion.match(segment)) {
          const start = i;
          const end = this.#findMostLikelyGroupEnd(defintion, segments, start);

          this.#buildMappedGroup(defintion, segments, start, end);
        }
      });
    });

    const segmentDefinitions = this.#schema.items.filter(
      (definition) => definition instanceof SegmentDefinition,
    );

    segmentDefinitions.forEach((defintion) => {
      segments.forEach((segment, i) => {
        if (!this.#consumedIndices.has(i) && defintion.match(segment)) {
          this.#consumedIndices.add(i);
          const mappedSegment = new MappedSegment(segment);
          this.#rootMessage.addSegment(mappedSegment.tag, mappedSegment);
        }
      });
    });

    segments.forEach((segment, i) => {
      if (!this.#consumedIndices.has(i)) {
        this.#rootMessage.addUnknown(segment);
        this.#consumedIndices.add(i);
      }
    });

    return this.#rootMessage;
  }
}

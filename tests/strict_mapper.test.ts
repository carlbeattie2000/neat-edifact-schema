import { describe, expect, it } from 'vitest';

import SchemaMissingGroupError from '../src/errors/SchemaMissingGroupError.js';
import SchemaMissingSegmentError from '../src/errors/SchemaMissingSegmentError.js';
import SchemaOutOfOrderError from '../src/errors/SchemaOutOfOrderError.js';
import SchemaRepeatLimitError from '../src/errors/SchemaRepeatLimitError.js';
import Mapper from '../src/mapper/index.js';
import {
  defineGroup,
  defineHead,
  defineSchema,
  defineSegment,
} from '../src/schema/definitions/define.js';

import type { Message, Segment } from 'neat-edifact';

// ============= Test Helpers =============
function createSegment(tag: string, values: string[]): Segment {
  return {
    tag,
    dataElements: values.map((v) => ({
      Value: v,
      getComponent: (idx: number) => ({ value: v.split(':')[idx] }),
    })),
    getDataElement(index: number) {
      return this.dataElements[index];
    },
    getQualifier() {
      return this.getDataElement(0)?.getComponent(0)?.value;
    },
  } as Segment;
}

function createMessage(segments: Segment[]): Message {
  return { segments } as Message;
}

// ============= Test Suites =============

describe('StrictMapper', () => {
  describe('Basic segment mapping', () => {
    it('should map a single required segment', () => {
      const schema = defineSchema({
        items: [defineSegment('BGM', { required: true })],
        strict: true,
      });

      const message = createMessage([createSegment('BGM', ['241', 'STOW123'])]);
      const mapper = new Mapper(schema);
      const result = mapper.map(message);

      expect(result.getSegment('BGM')).toBeDefined();
      expect(result.getSegment('BGM')?.tag).toBe('BGM');
    });

    it('should throw for required segment with wrong tag', () => {
      const schema = defineSchema({
        items: [defineSegment('BGM', { required: true })],
        strict: true,
      });

      const message = createMessage([createSegment('DTM', ['137:20260101:201'])]);
      const mapper = new Mapper(schema);

      expect(() => mapper.map(message)).toThrow(SchemaOutOfOrderError);
    });

    it('should map multiple segments in order', () => {
      const schema = defineSchema({
        items: [
          defineSegment('BGM', { required: true }),
          defineSegment('DTM', { required: true }),
          defineSegment('TDT', { required: true }),
        ],
        strict: true,
      });

      const message = createMessage([
        createSegment('BGM', ['241', 'STOW123']),
        createSegment('DTM', ['137:20260101:201']),
        createSegment('TDT', ['20', 'VOY123']),
      ]);
      const mapper = new Mapper(schema);
      const result = mapper.map(message);

      expect(result.getSegment('BGM')).toBeDefined();
      expect(result.getSegment('DTM')).toBeDefined();
      expect(result.getSegment('TDT')).toBeDefined();
    });
  });

  describe('Repeatable segments', () => {
    it('should map repeatable segments as array', () => {
      const schema = defineSchema({
        items: [defineSegment('LOC', { repeatable: 3 })],
        strict: true,
      });

      const message = createMessage([
        createSegment('LOC', ['147', '0010182']),
        createSegment('LOC', ['147', '0010193']),
        createSegment('LOC', ['147', '0010204']),
      ]);
      const mapper = new Mapper(schema);
      const result = mapper.map(message);

      expect(result.getSegments('LOC')).toHaveLength(3);
      expect(result.getSegment('LOC')).toBeDefined(); // returns first
    });

    it('should throw when repeatable limit exceeded', () => {
      const schema = defineSchema({
        items: [defineSegment('LOC', { repeatable: 2 })],
        strict: true,
      });

      const message = createMessage([
        createSegment('LOC', ['147', '0010182']),
        createSegment('LOC', ['147', '0010193']),
        createSegment('LOC', ['147', '0010204']),
      ]);
      const mapper = new Mapper(schema);

      expect(() => mapper.map(message)).toThrow(SchemaRepeatLimitError);
      expect(() => mapper.map(message)).toThrow(/LOC has a maxium repeat count of 2 but got 3/);
    });

    it('should allow fewer than repeatable limit', () => {
      const schema = defineSchema({
        items: [defineSegment('LOC', { repeatable: 5 })],
        strict: true,
      });

      const message = createMessage([
        createSegment('LOC', ['147', '0010182']),
        createSegment('LOC', ['147', '0010193']),
      ]);
      const mapper = new Mapper(schema);
      const result = mapper.map(message);

      expect(result.getSegments('LOC')).toHaveLength(2);
    });
  });

  describe('Qualifier matching', () => {
    it('should match segment with correct qualifier', () => {
      const schema = defineSchema({
        items: [defineSegment('LOC', { qualifier: '147', required: true })],
        strict: true,
      });

      const message = createMessage([createSegment('LOC', ['147', '0010182'])]);
      const mapper = new Mapper(schema);
      const result = mapper.map(message);

      expect(result.getSegment('LOC')).toBeDefined();
    });

    it('should throw when qualifier mismatches', () => {
      const schema = defineSchema({
        items: [defineSegment('LOC', { qualifier: '147', required: true })],
        strict: true,
      });

      const message = createMessage([createSegment('LOC', ['9', 'CNSHA'])]);
      const mapper = new Mapper(schema);

      expect(() => mapper.map(message)).toThrow(SchemaOutOfOrderError);
    });

    it('should distinguish same tag with different qualifiers', () => {
      const schema = defineSchema({
        items: [
          defineSegment('LOC', { qualifier: '147', required: true }),
          defineSegment('LOC', { qualifier: '9', required: true }),
        ],
        strict: true,
      });

      const message = createMessage([
        createSegment('LOC', ['147', '0010182']),
        createSegment('LOC', ['9', 'CNSHA']),
      ]);
      const mapper = new Mapper(schema);
      const result = mapper.map(message);

      expect(result.getSegments('LOC')).toHaveLength(2);
    });
  });

  describe('Groups', () => {
    it('should map simple group', () => {
      const schema = defineSchema({
        items: [
          defineGroup({
            head: defineHead('TDT', { required: true }),
            items: [defineSegment('LOC', { required: true })],
            required: true,
          }),
        ],
        strict: true,
      });

      const message = createMessage([
        createSegment('TDT', ['20', 'VOY123']),
        createSegment('LOC', ['147', 'TRMINA']),
      ]);
      const mapper = new Mapper(schema);
      const result = mapper.map(message);

      const groups = result.getGroups('TDT');
      expect(groups).toHaveLength(1);
      expect(groups[0].getSegment('TDT')).toBeDefined();
      expect(groups[0].getSegment('LOC')).toBeDefined();
    });

    it('should map repeatable groups', () => {
      const schema = defineSchema({
        items: [
          defineGroup({
            head: defineHead('NAD', { required: true }),
            repeatable: 3,
          }),
        ],
        strict: true,
      });

      const message = createMessage([
        createSegment('NAD', ['CA', 'SHIPPER1']),
        createSegment('NAD', ['CA', 'SHIPPER2']),
        createSegment('NAD', ['CA', 'SHIPPER3']),
      ]);
      const mapper = new Mapper(schema);
      const result = mapper.map(message);

      expect(result.getGroups('NAD')).toHaveLength(3);
    });

    it('should throw when group required missing', () => {
      const schema = defineSchema({
        items: [
          defineGroup({
            head: defineHead('TDT', { required: true }),
            required: true,
          }),
        ],
        strict: true,
      });

      const message = createMessage([createSegment('BGM', ['241', 'STOW123'])]);
      const mapper = new Mapper(schema);

      expect(() => mapper.map(message)).toThrow(SchemaMissingGroupError);
    });

    it('should nest groups correctly', () => {
      const schema = defineSchema({
        items: [
          defineGroup({
            head: defineHead('NAD', { required: true }),
            items: [
              defineGroup({
                head: defineHead('CTA', { required: true }),
                items: [defineSegment('COM', { repeatable: 2 })],
              }),
            ],
          }),
        ],
        strict: true,
      });

      const message = createMessage([
        createSegment('NAD', ['CA', 'SHIPPER']),
        createSegment('CTA', ['IC', 'John Doe']),
        createSegment('COM', ['TE', '123456']),
        createSegment('COM', ['FX', 'john@email.com']),
      ]);
      const mapper = new Mapper(schema);
      const result = mapper.map(message);

      const nads = result.getGroups('NAD');
      expect(nads).toHaveLength(1);

      const ctas = nads[0].getGroups('CTA');
      expect(ctas).toHaveLength(1);
      expect(ctas[0].getSegments('COM')).toHaveLength(2);
    });
  });

  describe('Order enforcement', () => {
    it('should throw when segments out of order', () => {
      const schema = defineSchema({
        items: [defineSegment('BGM', { required: true }), defineSegment('DTM', { required: true })],
        strict: true,
      });

      const message = createMessage([
        createSegment('DTM', ['137:20260101:201']),
        createSegment('BGM', ['241', 'STOW123']),
      ]);
      const mapper = new Mapper(schema);

      expect(() => mapper.map(message)).toThrow(SchemaOutOfOrderError);
    });

    it('should throw when groups out of order', () => {
      const schema = defineSchema({
        items: [
          defineGroup({
            head: defineHead('TDT', { required: true }),
            required: true,
          }),
          defineGroup({
            head: defineHead('NAD', { required: true }),
            required: true,
          }),
        ],
        strict: true,
      });

      const message = createMessage([
        createSegment('NAD', ['CA', 'SHIPPER']),
        createSegment('TDT', ['20', 'VOY123']),
      ]);
      const mapper = new Mapper(schema);

      expect(() => mapper.map(message)).toThrow(SchemaMissingGroupError);
      expect(() => mapper.map(message)).toThrow(/TDT/);
    });

    it('should throw when extra segments exist after all definitions', () => {
      const schema = defineSchema({
        items: [defineSegment('BGM', { required: true })],
        strict: true,
      });

      const message = createMessage([
        createSegment('BGM', ['241', 'STOW123']),
        createSegment('DTM', ['137:20260101:201']),
      ]);
      const mapper = new Mapper(schema);

      expect(() => mapper.map(message)).toThrow(/SchemaExtraSegmentError/);
    });
  });

  describe('Segment values', () => {
    it('should retrieve data element values', () => {
      const schema = defineSchema({
        items: [defineSegment('BGM', { required: true })],
        strict: true,
      });

      const message = createMessage([createSegment('BGM', ['241', 'STOW123', '9'])]);
      const mapper = new Mapper(schema);
      const result = mapper.map(message);
      const bgm = result.getSegment('BGM');

      expect(bgm?.getValue(0)).toBe('241');
      expect(bgm?.getValue(1)).toBe('STOW123');
      expect(bgm?.getValue(2)).toBe('9');
    });

    it('should retrieve nested group segment values', () => {
      const schema = defineSchema({
        items: [
          defineGroup({
            head: defineHead('NAD', { required: true }),
            items: [
              defineGroup({
                head: defineHead('CTA', { required: true }),
                items: [defineSegment('COM', { required: true })],
              }),
            ],
          }),
        ],
        strict: true,
      });

      const message = createMessage([
        createSegment('NAD', ['CA', 'SHIPPER']),
        createSegment('CTA', ['IC', 'John Doe']),
        createSegment('COM', ['TE', '123456']),
      ]);
      const mapper = new Mapper(schema);
      const result = mapper.map(message);

      const nad = result.getGroups('NAD')[0];
      const cta = nad.getGroups('CTA')[0];
      const com = cta.getSegment('COM');

      expect(nad.getSegment('NAD')?.getValue(0)).toBe('CA');
      expect(cta.getSegment('CTA')?.getValue(1)).toBe('John Doe');
      expect(com?.getValue(1)).toBe('123456');
    });
  });

  describe('Edge cases', () => {
    it('should handle empty message with no required segments', () => {
      const schema = defineSchema({
        items: [defineSegment('BGM', { required: false })],
        strict: true,
      });

      const message = createMessage([]);
      const mapper = new Mapper(schema);
      const result = mapper.map(message);

      expect(result.getSegment('BGM')).toBeUndefined();
    });

    it('should throw for empty message with required segment', () => {
      const schema = defineSchema({
        items: [defineSegment('BGM', { required: true })],
        strict: true,
      });

      const message = createMessage([]);
      const mapper = new Mapper(schema);

      expect(() => mapper.map(message)).toThrow(SchemaMissingSegmentError);
    });

    it('should handle group with no children', () => {
      const schema = defineSchema({
        items: [
          defineGroup({
            head: defineHead('TDT', { required: true }),
            required: true,
          }),
        ],
        strict: true,
      });

      const message = createMessage([createSegment('TDT', ['20', 'VOY123'])]);
      const mapper = new Mapper(schema);
      const result = mapper.map(message);

      expect(result.getGroups('TDT')).toHaveLength(1);
    });
  });

  describe('Optional segments', () => {
    it('should skip optional segment when not present', () => {
      const schema = defineSchema({
        items: [
          defineSegment('BGM', { required: true }),
          defineSegment('DTM', { required: false }),
          defineSegment('TDT', { required: true }),
        ],
        strict: true,
      });

      const message = createMessage([
        createSegment('BGM', ['241', 'STOW123']),
        createSegment('TDT', ['20', 'VOY123']),
      ]);
      const mapper = new Mapper(schema);
      const result = mapper.map(message);

      expect(result.getSegment('BGM')).toBeDefined();
      expect(result.getSegment('DTM')).toBeUndefined();
      expect(result.getSegment('TDT')).toBeDefined();
    });

    it('should map optional segment when present', () => {
      const schema = defineSchema({
        items: [
          defineSegment('BGM', { required: true }),
          defineSegment('DTM', { required: false }),
          defineSegment('TDT', { required: true }),
        ],
        strict: true,
      });

      const message = createMessage([
        createSegment('BGM', ['241', 'STOW123']),
        createSegment('DTM', ['137:20260101:201']),
        createSegment('TDT', ['20', 'VOY123']),
      ]);
      const mapper = new Mapper(schema);
      const result = mapper.map(message);

      expect(result.getSegment('DTM')).toBeDefined();
      expect(result.getSegment('TDT')).toBeDefined();
    });

    it('should skip multiple consecutive optional segments when not present', () => {
      const schema = defineSchema({
        items: [
          defineSegment('BGM', { required: true }),
          defineSegment('DTM', { required: false }),
          defineSegment('FTX', { required: false }),
          defineSegment('TDT', { required: true }),
        ],
        strict: true,
      });

      const message = createMessage([
        createSegment('BGM', ['241', 'STOW123']),
        createSegment('TDT', ['20', 'VOY123']),
      ]);
      const mapper = new Mapper(schema);
      const result = mapper.map(message);

      expect(result.getSegment('DTM')).toBeUndefined();
      expect(result.getSegment('FTX')).toBeUndefined();
      expect(result.getSegment('TDT')).toBeDefined();
    });

    it('should skip optional segment inside a group when not present', () => {
      const schema = defineSchema({
        items: [
          defineGroup({
            head: defineHead('TDT', { required: true }),
            items: [
              defineSegment('LOC', { required: true }),
              defineSegment('DTM', { required: false }),
              defineSegment('RFF', { required: true }),
            ],
            required: true,
          }),
        ],
        strict: true,
      });

      const message = createMessage([
        createSegment('TDT', ['20', 'VOY123']),
        createSegment('LOC', ['5', 'GBSOU']),
        createSegment('RFF', ['VON:VOY001']),
      ]);
      const mapper = new Mapper(schema);
      const result = mapper.map(message);

      const group = result.getGroups('TDT')[0];
      expect(group.getSegment('LOC')).toBeDefined();
      expect(group.getSegment('DTM')).toBeUndefined();
      expect(group.getSegment('RFF')).toBeDefined();
    });

    it('should skip all optional segments inside a group when none present', () => {
      const schema = defineSchema({
        items: [
          defineGroup({
            head: defineHead('LOC', { required: true }),
            items: [
              defineSegment('GID', { required: false }),
              defineSegment('GDS', { required: false }),
              defineSegment('FTX', { required: false }),
              defineSegment('MEA', { required: true }),
              defineSegment('RFF', { required: true }),
            ],
            required: true,
          }),
        ],
        strict: true,
      });

      const message = createMessage([
        createSegment('LOC', ['147', '020102']),
        createSegment('MEA', ['WT', 'G', 'KGM:24500']),
        createSegment('RFF', ['BN:MBOL123456']),
      ]);
      const mapper = new Mapper(schema);
      const result = mapper.map(message);

      const group = result.getGroups('LOC')[0];
      expect(group.getSegment('GID')).toBeUndefined();
      expect(group.getSegment('GDS')).toBeUndefined();
      expect(group.getSegment('FTX')).toBeUndefined();
      expect(group.getSegment('MEA')).toBeDefined();
      expect(group.getSegment('RFF')).toBeDefined();
    });

    it('should throw missing segment error not out of order when required segment absent', () => {
      const schema = defineSchema({
        items: [
          defineSegment('BGM', { required: true }),
          defineSegment('DTM', { required: false }),
          defineSegment('TDT', { required: true }),
        ],
        strict: true,
      });

      const message = createMessage([createSegment('BGM', ['241', 'STOW123'])]);
      const mapper = new Mapper(schema);

      expect(() => mapper.map(message)).toThrow(SchemaMissingSegmentError);
    });
  });
});

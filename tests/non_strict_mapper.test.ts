import { describe, expect, it } from 'vitest';

import SchemaRepeatLimitError from '../src/errors/SchemaRepeatLimitError.js';
import Mapper from '../src/mapper/index.js';
import {
  defineGroup,
  defineSchema,
  defineSegment,
} from '../src/schema/define.js';

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
describe('NonStrictMapper', () => {
  // ========== Basic Segment Mapping ==========
  describe('Basic segment mapping', () => {
    it('should map a single required segment', () => {
      const schema = defineSchema({
        items: [defineSegment('BGM', { required: true })],
        strict: false,
      });

      const message = createMessage([createSegment('BGM', ['241', 'STOW123'])]);
      const mapper = new Mapper(schema);
      const result = mapper.map(message);

      expect(result.getSegment('BGM')).toBeDefined();
      expect(result.getSegment('BGM')?.tag).toBe('BGM');
    });

    it('should return undefined for missing optional segment', () => {
      const schema = defineSchema({
        items: [defineSegment('BGM', { required: false })],
        strict: false,
      });

      const message = createMessage([]);
      const mapper = new Mapper(schema);
      const result = mapper.map(message);

      expect(result.getSegment('BGM')).toBeUndefined();
    });

    it('should map multiple segments regardless of order', () => {
      const schema = defineSchema({
        items: [
          defineSegment('BGM', { required: true }),
          defineSegment('DTM', { required: true }),
        ],
        strict: false,
      });

      const message = createMessage([
        createSegment('DTM', ['137:20260101:201']),
        createSegment('BGM', ['241', 'STOW123']),
      ]);
      const mapper = new Mapper(schema);
      const result = mapper.map(message);

      expect(result.getSegment('BGM')).toBeDefined();
      expect(result.getSegment('DTM')).toBeDefined();
    });

    it('should collect unknown segments', () => {
      const schema = defineSchema({
        items: [defineSegment('BGM', { required: true })],
        strict: false,
      });

      const message = createMessage([
        createSegment('BGM', ['241', 'STOW123']),
        createSegment('XYZ', ['extra']),
        createSegment('ABC', ['another']),
      ]);
      const mapper = new Mapper(schema);
      const result = mapper.map(message);

      expect(result.getSegment('BGM')).toBeDefined();
      expect(result.unknown).toHaveLength(2);
      expect(result.unknown[0].tag).toBe('XYZ');
      expect(result.unknown[1].tag).toBe('ABC');
    });
  });

  // ========== Repeatable Segments ==========
  describe('Repeatable segments', () => {
    it('should map repeatable segments as array', () => {
      const schema = defineSchema({
        items: [defineSegment('LOC', { repeatable: 3 })],
        strict: false,
      });

      const message = createMessage([
        createSegment('LOC', ['147', '0010182']),
        createSegment('LOC', ['147', '0010193']),
        createSegment('LOC', ['147', '0010204']),
      ]);
      const mapper = new Mapper(schema);
      const result = mapper.map(message);

      expect(result.getSegments('LOC')).toHaveLength(3);
      expect(result.getSegment('LOC')).toBeDefined();
    });

    it('should allow fewer than repeatable limit', () => {
      const schema = defineSchema({
        items: [defineSegment('LOC', { repeatable: 5 })],
        strict: false,
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

  // ========== Qualifier Matching ==========
  describe('Qualifier matching', () => {
    it('should match segment with correct qualifier', () => {
      const schema = defineSchema({
        items: [defineSegment('LOC', { qualifier: '147', required: true })],
        strict: false,
      });

      const message = createMessage([createSegment('LOC', ['147', '0010182'])]);
      const mapper = new Mapper(schema);
      const result = mapper.map(message);

      expect(result.getSegment('LOC')).toBeDefined();
    });

    it('should skip segment with wrong qualifier and treat as unknown', () => {
      const schema = defineSchema({
        items: [defineSegment('LOC', { qualifier: '147', required: true })],
        strict: false,
      });

      const message = createMessage([createSegment('LOC', ['9', 'CNSHA'])]);
      const mapper = new Mapper(schema);
      const result = mapper.map(message);

      // No LOC with qualifier 147 found → undefined
      expect(result.getSegment('LOC')).toBeUndefined();
      // The LOC+9 should end up in unknown because it doesn't match any definition
      expect(result.unknown).toHaveLength(1);
      expect(result.unknown[0].tag).toBe('LOC');
    });

    it('should match segments with different qualifiers', () => {
      const schema = defineSchema({
        items: [
          defineSegment('LOC', { qualifier: '147' }),
          defineSegment('LOC', { qualifier: '9' }),
        ],
        strict: false,
      });

      const message = createMessage([
        createSegment('LOC', ['9', 'CNSHA']),
        createSegment('LOC', ['147', '0010182']),
      ]);
      const mapper = new Mapper(schema);
      const result = mapper.map(message);

      const segments = result.getSegments('LOC');
      const qualifiers = segments.map((seg) => seg.getValue(0));

      expect(qualifiers).toHaveLength(2);
      expect(qualifiers).toContain('9');
      expect(qualifiers).toContain('147');
    });
  });

  // ========== Groups ==========
  describe('Groups', () => {
    it('should map simple group with children', () => {
      const schema = defineSchema({
        items: [
          defineGroup({
            head: defineSegment('TDT', { required: true }),
            items: [
              defineSegment('LOC', { required: true }),
              defineSegment('DTM', { required: true }),
            ],
          }),
        ],
        strict: false,
      });

      const message = createMessage([
        createSegment('TDT', ['20', 'VOY123']),
        createSegment('DTM', ['132:20260101:201']),
        createSegment('LOC', ['147', 'TRMINA']),
      ]);
      const mapper = new Mapper(schema);
      const result = mapper.map(message);

      const groups = result.getGroups('TDT');
      expect(groups).toHaveLength(1);
      const group = groups[0];
      expect(group.getSegment('LOC')).toBeDefined();
      expect(group.getSegment('DTM')).toBeDefined();
    });

    it('should map repeatable groups', () => {
      const schema = defineSchema({
        items: [
          defineGroup({
            head: defineSegment('NAD', { required: true }),
            repeatable: 3,
            items: [],
          }),
        ],
        strict: false,
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

    it('should collect all groups regardless of repeatable limit', () => {
      const schema = defineSchema({
        items: [
          defineGroup({
            head: defineSegment('NAD', { required: true }),
            repeatable: 2, // 👈 ignored in non‑strict
            items: [],
          }),
        ],
        strict: false,
      });

      const message = createMessage([
        createSegment('NAD', ['CA', 'SHIPPER1']),
        createSegment('NAD', ['CA', 'SHIPPER2']),
        createSegment('NAD', ['CA', 'SHIPPER3']),
      ]);
      const mapper = new Mapper(schema);
      const result = mapper.map(message);

      // All three should be collected (repeatable ignored)
      expect(result.getGroups('NAD')).toHaveLength(3);
      expect(result.unknown).toHaveLength(0);
    });

    it('should not throw if required group missing (optional group)', () => {
      const schema = defineSchema({
        items: [
          defineGroup({
            head: defineSegment('TDT', { required: false }),
            items: [defineSegment('LOC', { required: true })],
          }),
        ],
        strict: false,
      });

      const message = createMessage([createSegment('BGM', ['241', 'STOW123'])]);
      const mapper = new Mapper(schema);
      const result = mapper.map(message);

      expect(result.getGroups('TDT')).toHaveLength(0);
      // The BGM becomes unknown because there's no definition for it
      expect(result.unknown).toHaveLength(1);
    });

    it('should nest groups correctly', () => {
      const schema = defineSchema({
        items: [
          defineGroup({
            head: defineSegment('NAD', { required: true }),
            items: [
              defineSegment('RFF', { required: true }),
              defineGroup({
                head: defineSegment('CTA', { required: true }),
                items: [defineSegment('COM', { repeatable: 2 })],
              }),
            ],
          }),
        ],
        strict: false,
      });

      const message = createMessage([
        createSegment('NAD', ['CA', 'SHIPPER']),
        createSegment('COM', ['TE', '123456']),
        createSegment('CTA', ['IC', 'John Doe']),
        createSegment('COM', ['FX', 'john@email.com']),
        createSegment('RFF', ['VN', 'VOY123']),
      ]);
      const mapper = new Mapper(schema);
      const result = mapper.map(message);

      const nads = result.getGroups('NAD');
      expect(nads).toHaveLength(1);
      const nad = nads[0];
      expect(nad.getSegment('RFF')).toBeDefined();
      const ctas = nad.getGroups('CTA');
      expect(ctas).toHaveLength(1);
      const cta = ctas[0];
      expect(cta.getSegments('COM')).toHaveLength(2);
    });
  });

  // ========== Edge Cases ==========
  describe('Edge cases', () => {
    it('should handle empty message with no required segments', () => {
      const schema = defineSchema({
        items: [defineSegment('BGM', { required: false })],
        strict: false,
      });

      const message = createMessage([]);
      const mapper = new Mapper(schema);
      const result = mapper.map(message);

      expect(result.getSegment('BGM')).toBeUndefined();
      expect(result.unknown).toHaveLength(0);
    });

    it('should handle group with no children', () => {
      const schema = defineSchema({
        items: [
          defineGroup({
            head: defineSegment('NAD', { required: true }),
            items: [],
          }),
        ],
        strict: false,
      });

      const message = createMessage([createSegment('NAD', ['CA', 'SHIPPER'])]);
      const mapper = new Mapper(schema);
      const result = mapper.map(message);

      const groups = result.getGroups('NAD');
      expect(groups).toHaveLength(1);
      expect(groups[0].head.getValue(0)).toBe('CA');
    });

    it('should collect segments that are inside group slices but not defined as children', () => {
      const schema = defineSchema({
        items: [
          defineGroup({
            head: defineSegment('TDT', { required: true }),
            items: [defineSegment('LOC', { required: true })],
          }),
        ],
        strict: false,
      });

      const message = createMessage([
        createSegment('TDT', ['20', 'VOY123']),
        createSegment('MEA', ['WT', 'KGM', '20000']), // not defined
        createSegment('LOC', ['147', 'TRMINA']),
      ]);
      const mapper = new Mapper(schema);
      const result = mapper.map(message);

      const groups = result.getGroups('TDT');
      expect(groups).toHaveLength(1);
      // The MEA should be in unknown of the group? Or top-level unknown?
      // Typically unknown segments belong to the container that owns the slice.
      // In our design, unknown segments inside a group's slice are added to the group's unknown array (if we have that).
      // For simplicity, the spec may put them in root unknown. We need to test the expected behavior.
      // Here we assume they become root unknown because they are not matched anywhere.
      expect(result.unknown).toHaveLength(1);
      expect(result.unknown[0].tag).toBe('MEA');
    });
  });
});

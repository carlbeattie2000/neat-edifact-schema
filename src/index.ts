import type { Message, Segment } from "neat-edifact";
import { defineGroup, defineHead, defineSchema, defineSegment } from "./schema/define.js";
import Mapper from "./mapper/index.js";

function createSegment(tag: string, values: string[]): Segment {
  return {
    tag,
    dataElements: values.map((v) => ({
      Value: v,
      getComponent: (idx: number) => ({ value: v.split(':')[idx] }),
    })),
    getDataElement: function (index: number) {
      return this.dataElements[index];
    },
  } as Segment;
}

function createMessage(segments: Segment[]): Message {
  return { segments } as Message;
}

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

console.log(result);

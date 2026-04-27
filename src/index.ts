import { defineSchema, segment } from './schema/define.js';

const schema = defineSchema({
  segments: [
    segment('chucky', { required: false }),
  ],
  groups: [],
});

console.log(schema);

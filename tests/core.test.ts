import { describe, it } from 'vitest';

import { defineSchema, segment } from '../src/schema/define.js';

describe('Parser.split', () => {
  it('splits on delimiter', () => {
    const schema = defineSchema({
      segments: [
        segment('chucky', { required: false }),
      ],
      groups: [],
    });

    console.log(schema);
  });
});

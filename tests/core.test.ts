import { describe, it } from 'vitest';

import EdifactDocument from '../src/document/index.js';
import { defineSchema, segment } from '../src/schema/define.js';

const EXAMPLE_EDIFACT = `
UNB+UNOA:2+RECIPIENTID:SENDERID+241101:0930+TR000001'
UNH+1+BAPLIE:D:96A:UN:4.0'
BGM+241+STOW123+9'
DTM+137:202411011200:203'
TDT+20+VOY001+++VESSEL:MAERSK EDINBURGH'
LOC+147+TRMINA'
RFF+VM:VOY001'
LOC+9+CNLHR'
LOC+11+CNSHA'
EQD+CN+MSKU1234567+22G1'
LOC+147+0010182'
MEA+WT+KGM+20000'
UNT+12+1'
UNZ+1+TR000001''
`;

describe('Parser.split', () => {
  it('splits on delimiter', () => {
    const schema = defineSchema({
      segments: [
        segment('BGM', { required: true }),
        segment('DTM', { required: true }),
      ],
      groups: [],
      strict: true,
    });

    const document = EdifactDocument.useStrict().fromString(EXAMPLE_EDIFACT, schema);

    console.log(document.interchanges);
  });
});

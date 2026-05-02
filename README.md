# neat-edifact-schema
A TypeScript schema mapper for UN/EDIFACT interchanges. Give it a raw EDIFACT string and a schema definition, get back a typed, queryable object. That's it.
It handles the structure mapping layer only — no business logic, no transforms, no opinions about what your data means. If you need BAPLIE parsing with domain objects, build that on top of this.

## Install
```bash
npm install neat-edifact-schema neat-edifact
pnpm add neat-edifact-schema neat-edifact
```

## Usage
```ts
import { defineGroup, defineSchema, defineSegment, EdifactDocument } from "neat-edifact-mapper";

const rawMessage = `UNA:+.? '
UNB+UNOA:2+SENDER+RECIPIENT+240101:1200+00000001'
UNH+1+ORDERS:D:96A:UN:1A'
BGM+220+ORDER123+9'
DTM+137:202405011200:203'
LIN+1+20+ITEM001'
QTY+21:10:PCE'
UNT+6+1'
UNZ+1+00000001'`

const schema = defineSchema({
  items: [
    defineSegment('BGM', { required: true }),
    defineSegment('DTM', { required: true }),
    defineGroup({
      head: defineSegment('LIN', { required: true }),
      items: [
        defineSegment('QTY', { required: false })
      ],
      required: false
    })
  ],
  strict: true
});

EdifactDocument.useStrict().fromString(rawMessage, schema).map() // MappedMessage[];
```

`map()` always returns `MappedMessage[]` — even for single interchange files. Just use the first array item for the common case.

## Strict mode
By default the mapper is lenient. It'll do its best with whatever you give it, collecting unrecognised segments into an `unknown` bucket and stopping if things go too far off the rails.

If you want it to throw on any of that, pass `strict: true` when creating the schema and use `.useStrict()` on the `EdifactDocument`.

```ts
const schema = defineSchema({
  items: [...],
  strict: true
});

EdifactDocument.useStrict().fromString('', schema).map()
```

Strict mode enforces:
- **Required segments** — if a segment is marked `required: true` and is missing, an error is thrown
- **Unknown segments** — any segment not defined in your schema will throw rather than being collected

## API

### `EdifactDocument`
```ts
EdifactDocument.useStrict()
EdifactDocument.fromString(raw: string, schema: Schema): EdifactDocument
EdifactDocument.map(): MappedMessage[]
```

### `MappedMessage`
```ts
mappedMessage.get('BGM')           // MappedSegment | MappedGroup | undefined
mappedMessage.get('LIN')           // MappedGroup | undefined
mappedMessage.unknown              // Segment[] — unrecognised segments (lenient mode only)
```

### `MappedSegment`
```ts
mappedSegment.tag
mappedSegment.getDataElement(0)
mappedSegment.getDataElement(0)?.value
mappedSegment.getDataElement(0)?.getComponent(1)?.value
```

### `MappedGroup`
```ts
mappedGroup.head                   // MappedSegment
mappedGroup.get('QTY')             // MappedSegment | undefined
mappedGroup.unknown                // Segment[]
```

### Schema helpers
```ts
defineSchema({ items: SegmentDefinition[], strict?: boolean }): Schema
defineSegment(tag: string, options?: SegmentOptions): SegmentDefinition
defineGroup({ head: SegmentDefinition, items: SegmentDefinition[], required?: boolean }): GroupDefinition
```

### `SegmentOptions`
```ts
{
  required?: boolean       // default: false
  repeatable?: number      // default: 1
  qualifier?: string       // match on first data element value
  ignore?: boolean         // parse but discard
}
```

## Errors
```ts
import { EdifactSyntaxError, EdifactEnvelopeError, EdifactValidationError } from 'neat-edifact'
import { EdifactMappingError } from 'neat-edifact-schema'
```
- `EdifactSyntaxError` — malformed input from the parser layer
- `EdifactEnvelopeError` — broken `UNB`/`UNZ`/`UNH`/`UNT` structure
- `EdifactValidationError` — count or reference mismatches (strict mode only)
- `EdifactMappingError` — required segment missing or unknown segment encountered (strict mode only)

## Notes
- `map()` always returns `MappedMessage[]` — use `.first()` or index `[0]` for the common single-message case
- In lenient mode, unrecognised segments are collected into `.unknown` on the `MappedMessage` or `MappedGroup` — position is preserved relative to surrounding mapped segments
- The scan limit in lenient mode is 999 consecutive unmatched segments — at that point the mapper returns whatever it has built so far
- Zero runtime dependencies beyond `neat-edifact`

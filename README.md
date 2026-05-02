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
import { Mapper } from 'neat-edifact-mapper'

const raw = `UNB+UNOA:2+SENDER+RECEIVER+260424:0811+000001'
UNH+000001+BAPLIE:D:95B:UN:SMDG20'
BGM++V123456+9'
UNT+3+000001'
UNZ+1+000001'`

const schema = defineSchema();

const result = new Parser(raw).parse()
const interchange = result.first();

console.log(interchange.senderId)   // 'SENDER'
console.log(interchange.messages[0].messageType) // 'BAPLIE'
console.log(interchange.messages[0].segments[0].tag) // 'BGM'
```

`parse()` always returns `InterchangeResult` — even for single interchange files. Just use `result.first()` for the common case.

## Strict mode

By default the parser is lenient. It'll do its best with whatever you give it — orphaned segments, missing `UNZ`, mismatched references, it'll handle it all gracefully.

If you want it to throw on any of that, pass `true` as the second argument:

```ts
new Parser(raw, true).parse()
```

Strict mode enforces:
- First segment must be `UNB`, last must be `UNZ`
- Only one `UNB`/`UNZ` pair
- Every `UNH` must have a matching `UNT`
- No segments outside a `UNH`/`UNT` pair
- Control references must match between `UNB`/`UNZ` and `UNH`/`UNT`
- Segment and message counts must match what's declared

## UNA

If the file has a `UNA` service string advice, the parser reads it automatically and uses those delimiters. If not, it falls back to the EDIFACT defaults (`+`, `:`, `'`, `?`). You don't need to do anything.

## API

### `Parser`

```ts
new Parser(rawContent: string, strict?: boolean)
parser.parse(): InterchangeResult
```

### `InterchangeResult`

```ts
interchangeResult.first()
interchangeResult.firstOrFail()
interchangeResult.at(0)
interchangeResult.atOrFail(1)
interchangeResult.length()
interchangeResult.all()
interchangeResult.errors()
interchangeResult.hasErrors()
interchangeResult.isValid()
```


### `Interchange`

```ts
interchange.syntaxIdentifier  // e.g. 'UNOA'
interchange.syntaxVersion     // e.g. '2'
interchange.senderId
interchange.recipientId
interchange.date              // 'YYMMDD'
interchange.time              // 'HHMM'
interchange.controlReference
interchange.declaredMessageCount
interchange.messages          // Message[]
```

### `Message`

```ts
message.messageReferenceNumber
message.messageType     // e.g. 'BAPLIE'
message.messageVersion  // e.g. 'D'
message.messageRelease  // e.g. '95B'
message.controllingAgency
message.associationCode
message.declaredSegmentCount
message.segments        // Segment[]
```

### `Segment`

```ts
segment.tag                        // e.g. 'LOC'
segment.getDataElement(0)          // DataElement | undefined
segment.getDataElement(0)?.Value   // first component of that element
segment.getDataElement(0)?.getComponent(1)?.value  // specific component
```

## Errors

```ts
import { EdifactSyntaxError, EdifactEnvelopeError, EdifactValidationError, InterchangeNotFoundError } from 'neat-edifact'

```

- `EdifactSyntaxError` — malformed input, e.g. a segment with no tag
- `EdifactEnvelopeError` — missing or broken `UNB`/`UNZ`/`UNH`/`UNT` structure
- `EdifactValidationError` — count or reference mismatches (strict mode only)
- `InterchangeNotFoundError` — thrown by `.firstOrFail()` when the result is empty, or `.atOrFail(n)` when no interchange exists at that index

## Notes

- Multiple interchanges in one file are supported in non-strict mode — each `UNB` produces a separate `Interchange` on the `InterchangeResult`
- The release character (`?` by default) is handled correctly at all levels
- Zero runtime dependencies

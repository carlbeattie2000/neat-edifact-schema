import SchemaError from './base.js';

export default class SchemaMissingSegmentError extends SchemaError {
  constructor(expected: string) {
    super(`Missing segment: expected ${expected}`);
  }
}

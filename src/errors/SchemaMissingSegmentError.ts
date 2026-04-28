import SchemaError from './base.js';

export default class SchemaMissingSegmentError extends SchemaError {
  constructor() {
    super(`SchemaMissingSegmentError`);
  }
}

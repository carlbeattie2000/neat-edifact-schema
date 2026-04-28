import SchemaError from './base.js';

export default class SchemaExtraSegmentError extends SchemaError {
  constructor() {
    super('SchemaExtraSegmentError');
  }
}

import SchemaError from './base.js';

export default class SchemaOutOfOrderError extends SchemaError {
  constructor() {
    super('Segment out of order');
  }
}

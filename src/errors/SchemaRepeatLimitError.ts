import SchemaError from './base.js';

export default class SchemaRepeatLimitError extends SchemaError {
  constructor(tag: string, maxRepeatable: number, segmentsCount: number) {
    super(`RepeatLimitError: ${tag} has a maxium repeat count of ${maxRepeatable} but got ${segmentsCount}`)
  }
}

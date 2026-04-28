import SchemaError from './base.js';

export default class SchemaMissingGroupError extends SchemaError {
  constructor(group: string) {
    super(`Schema Missing Group: ${group}`);
  }
}

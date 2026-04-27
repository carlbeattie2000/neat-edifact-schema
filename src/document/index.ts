import { readFile } from 'node:fs/promises';

import { Parser } from 'neat-edifact';

import Mapper from '../mapper/index.js';

import type { Interchange } from 'neat-edifact';

import type MappedMessage from '../mapper/mapped_message.js';
import type { MapperOptions } from '../mapper/mapper_options.js';
import type EdifactSchema from '../schema/index.js';

export default class EdifactDocument {
  #interchanges: Interchange[];

  #schema: EdifactSchema;

  constructor(interchanges: Interchange[], schema: EdifactSchema) {
    this.#interchanges = interchanges;
    this.#schema = schema;
  }

  public static useStrict(): {
    fromFile: (path: string, schema: EdifactSchema) => Promise<EdifactDocument>;
    fromString: (content: string, schema: EdifactSchema) => EdifactDocument;
  } {
    return {
      fromFile: async (path: string, schema: EdifactSchema) => {
        const fileContent = await readFile(path, 'utf-8');
        const interchanges = new Parser(fileContent, true).parse();

        return new EdifactDocument(interchanges, schema);
      },
      fromString: (content: string, schema: EdifactSchema) => {
        const interchanges = new Parser(content, true).parse();

        return new EdifactDocument(interchanges, schema);
      },
    };
  }

  public static async fromFile(
    path: string,
    schema: EdifactSchema,
  ): Promise<EdifactDocument> {
    const fileContent = await readFile(path, 'utf-8');
    const interchanges = new Parser(fileContent, false).parse();

    return new EdifactDocument(interchanges, schema);
  }

  public static fromString(
    content: string,
    schema: EdifactSchema,
  ): EdifactDocument {
    const interchanges = new Parser(content, false).parse();

    return new EdifactDocument(interchanges, schema);
  }

  public map(options?: MapperOptions): MappedMessage[] {
    const mapper = new Mapper(this.#schema, options);
    const results: MappedMessage[] = [];

    this.#interchanges.forEach((interchange) => {
      results.push(
        ...interchange.messages.map((message) => mapper.map(message)),
      );
    });

    return results;
  }

  get interchanges(): Interchange[] {
    return this.#interchanges;
  }
}

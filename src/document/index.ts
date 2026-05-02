import { readFile } from 'node:fs/promises';

import { Parser } from 'neat-edifact';

import Mapper from '../mapper/index.js';

import type { InterchangeResult } from 'neat-edifact';

import type MappedMessage from '../mapper/mapped_message.js';
import type EdifactSchema from '../schema/index.js';

export default class EdifactDocument {
  #interchanges: InterchangeResult;

  #schema: EdifactSchema;

  constructor(interchanges: InterchangeResult, schema: EdifactSchema) {
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

  public map(): MappedMessage[] {
    const mapper = new Mapper(this.#schema);
    const results: MappedMessage[] = [];

    this.#interchanges.all().forEach((interchange) => {
      results.push(
        ...interchange.messages.map((message) => mapper.map(message)),
      );
    });

    return results;
  }

  get interchanges(): InterchangeResult {
    return this.#interchanges;
  }
}

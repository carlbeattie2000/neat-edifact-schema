import { readFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';

import { Parser } from 'neat-edifact';

import type { Interchange } from 'neat-edifact';

export default class EdifactDocument {
  #interchanges: Interchange[];

  constructor(interchanges: Interchange[]) {
    this.#interchanges = interchanges;
  }

  public static async fromFile(
    path: string,
    strict?: boolean,
  ): Promise<EdifactDocument> {
    const fileContent = await readFile(path, 'utf-8');
    const interchanges = new Parser(fileContent, strict ?? false);
  }

  public static fromFileSync(path: string, strict?: boolean): EdifactDocument {
    const fileContent = readFileSync(path, 'utf-8');
    const interchanges = new Parser(fileContent, strict ?? false);
  }

  public static fromString(content: string, strict?: boolean): EdifactDocument {
    const interchanges = new Parser(content, strict ?? false);
  }

  get interchanges(): Interchange[] {
    return this.#interchanges;
  }
}

import { Parser, type Interchange } from "neat-edifact";
import { readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";

export default class EdifactDocument {
	public static async fromFile(
		path: string,
		strict?: boolean,
	): Promise<EdifactDocument> {
		const fileContent = await readFile(path, "utf-8");
		const interchanges = Parser(fileContent, strict ?? false);
	}

	public static fromFileSync(path: string, strict?: boolean): EdifactDocument {
		const fileContent = readFileSync(path, "utf-8");
    const interchanges = Parser(fileContent, strict ?? false);
	}

	public static fromString(content: string): EdifactDocument {
    const interchanges = Parser(content, strict ?? false);
  }
}

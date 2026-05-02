import type { Segment } from 'neat-edifact';

export default class Cursor {
  #cursor: number;

  #segments: Segment[];

  #checkpoint: number;

  constructor(segments: Segment[]) {
    this.#cursor = 0;
    this.#checkpoint = 0;
    this.#segments = segments;
  }

  get segment(): Segment | undefined {
    return this.#segments[this.current];
  }

  get segments(): Segment[] {
    return Object.assign([], this.#segments);
  }

  get current(): number {
    return this.#cursor;
  }

  public next(): number {
    this.#cursor += 1;
    return this.#cursor;
  }

  public previous(): number {
    this.#cursor -= 1;
    return this.#cursor;
  }

  public reset(): void {
    this.#cursor = 0;
  }

  public checkpoint(): void {
    this.#checkpoint = this.#cursor;
  }

  public rollback(): void {
    this.#cursor = this.#checkpoint;
  }
}

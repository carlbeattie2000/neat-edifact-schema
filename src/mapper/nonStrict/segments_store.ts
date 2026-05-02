export default class SegmentIndexStore {
  #values: Set<number>;

  #snapshot: Set<number>;

  constructor() {
    this.#values = new Set();
    this.#snapshot = new Set();
  }

  public toArray(): number[] {
    return Array.from(this.#values);
  }

  public add(index: number): void {
    this.#values.add(index);
  }

  public has(index: number): boolean {
    return this.#values.has(index);
  }

  public remove(index: number): void {
    this.#values.delete(index);
  }

  public join(store: SegmentIndexStore): void {
    this.#values = this.#values.union(store.#values);
  }

  public transaction(): void {
    if (this.#snapshot.size > 0) {
      throw new Error('SegmentStore: Transaction already in progress');
    }
    this.#snapshot = new Set(this.#values);
  }

  public commit(): void {
    this.#snapshot.clear();
  }

  public rollback(): void {
    if (this.#snapshot.size > 0) {
      this.#values = new Set(this.#snapshot);
      this.#snapshot.clear();
    }
  }
}

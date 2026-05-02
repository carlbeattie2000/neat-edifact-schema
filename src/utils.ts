export function arrayIsEmpty(arr: unknown[]): boolean {
  return arr.length === 0;
}

export function forEachFrom<T>(
  arr: T[],
  fromIndex: number,
  callback: (value: T, index: number) => void,
): void {
  for (let i = fromIndex; i < arr.length; i += 1) {
    const value = arr[i];
    if (!value) return;
    callback(value, i);
  }
}

export function forEachRange<T>(
  arr: T[],
  fromIndex: number,
  toIndex: number,
  callback: (value: T, index: number) => void,
): void {
  for (let i = fromIndex; i <= toIndex; i += 1) {
    const value = arr[i];
    if (!value) return;
    callback(value, i);
  }
}

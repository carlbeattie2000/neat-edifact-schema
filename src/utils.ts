import { ZERO } from './constants.js';

export function isZero(value: number): boolean {
  return value === ZERO;
}

export function arrayIsEmpty(arr: unknown[]): boolean {
  return isZero(arr.length);
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

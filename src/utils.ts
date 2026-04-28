import { ZERO } from "./constants.js";

export function isZero(value: number): boolean {
  return value === ZERO;
}

export function arrayIsEmpty(arr: unknown[]): boolean {
  return isZero(arr.length);
}

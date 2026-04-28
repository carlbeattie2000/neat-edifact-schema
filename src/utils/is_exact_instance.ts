export function isExactInstanceOf<T extends object>(
  obj: object,
  constructor: new (...args: any[]) => T,
): boolean {
  return obj instanceof constructor && obj.constructor === constructor;
}

export function tPrint(char: string, ...args: unknown[]) {
  console.log(''.padEnd(5, char), args);
}

export interface MapperOptions {
  /**
   * When true: segments must appear exactly in order; required definitions must exist;
   * extra segments/groups cause errors.
   *
   * @default false
   */
  strict?: boolean;

  /**
   * When true: trim white space
   *
   * @default true
   */
  trimValues?: boolean;

  /**
   * When true: qualifer matching is case-insensitive
   *
   * @default false
   */
  caseInsensitiveQualifiers?: boolean;

  /**
 * Maximum segments to scan for a single definition in non‑strict mode.
 * Prevents infinite loops on malformed messages.
 *
 * @default 1000
 */
  maxScanDistance?: number;
}

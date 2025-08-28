/**
 * Safe utility functions to prevent runtime crashes
 * when dealing with potentially undefined or null values
 */

/**
 * Converts a value to a string array, handling various input types safely
 */
export function toArray(v: unknown): string[] {
  return Array.isArray(v) ? v as string[] :
         typeof v === 'string' && v.length ? (v as string).split(',') :
         [];
}

/**
 * Safely checks if a haystack contains a needle, handling undefined/null values
 */
export function safeIncludes(
  haystack: string | string[] | null | undefined,
  needle: string
): boolean {
  if (Array.isArray(haystack)) return haystack.includes(needle);
  if (typeof haystack === 'string') return haystack.includes(needle);
  return false;
}

/**
 * Safely maps over an array, defaulting to empty array if undefined/null
 */
export function safeMap<T, R>(
  items: T[] | null | undefined,
  mapper: (item: T, index: number) => R
): R[] {
  return (items ?? []).map(mapper);
}

/**
 * Safely filters an array, defaulting to empty array if undefined/null
 */
export function safeFilter<T>(
  items: T[] | null | undefined,
  predicate: (item: T, index: number) => boolean
): T[] {
  return (items ?? []).filter(predicate);
}

/**
 * Safely gets the length of an array, defaulting to 0 if undefined/null
 */
export function safeLength(items: unknown[] | null | undefined): number {
  return Array.isArray(items) ? items.length : 0;
}

/**
 * Safely joins an array with a separator, defaulting to empty string if undefined/null
 */
export function safeJoin(
  items: string[] | null | undefined,
  separator: string = ','
): string {
  return Array.isArray(items) ? items.join(separator) : '';
}

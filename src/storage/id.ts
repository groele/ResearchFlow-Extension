/**
 * Generate a unique ID with a prefix.
 * Uses crypto.randomUUID() for high-entropy, collision-resistant IDs.
 */
export function generateId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID()}`;
}

/** Queries are whitespace-separated tokens; repeated words add no search matches. */
export function compactSearchText(parts: string[], alreadyIndexed = ''): string {
  const words = new Set(parts.join(' ').toLowerCase().split(/\s+/u).filter(Boolean));
  for (const word of alreadyIndexed.split(/\s+/u)) words.delete(word);
  return [...words].join(' ');
}

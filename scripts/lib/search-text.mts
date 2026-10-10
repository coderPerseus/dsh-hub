/** Queries are whitespace-separated substrings; keep one copy of every match. */
export function compactSearchText(parts: string[], alreadyIndexed = ''): string {
  const words = [...new Set(parts.join(' ').toLowerCase().split(/\s+/u).filter(Boolean))]
    .sort((a, b) => b.length - a.length);
  const existing = alreadyIndexed.toLowerCase();
  const retained: string[] = [];
  for (const word of words) {
    if (!existing.includes(word) && !retained.some(other => other.includes(word))) retained.push(word);
  }
  return retained.join(' ');
}

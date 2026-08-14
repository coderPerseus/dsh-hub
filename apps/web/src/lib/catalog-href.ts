type CatalogHrefInput = {
  categories?: string[];
  compatibility?: string[];
  cursor?: string | null;
  query?: string;
  sort?: string;
};

export function catalogHref({
  categories = [],
  compatibility = [],
  cursor = null,
  query = "",
  sort = "featured",
}: CatalogHrefInput): string {
  const params = new URLSearchParams();
  const trimmed = query.trim();
  if (trimmed) params.set("q", trimmed);
  for (const category of categories) params.append("category", category);
  for (const item of compatibility) params.append("compatibility", item);
  if (sort && sort !== "featured") params.set("sort", sort);
  if (cursor) params.set("cursor", cursor);
  const search = params.toString();
  return search ? `/?${search}` : "/";
}

const PAGE_SIZE = 24;

export function previousCatalogCursor(cursor: string | null, pageSize = PAGE_SIZE): string | null {
  if (!cursor) return null;
  try {
    const offset = Number(atob(cursor));
    if (!Number.isSafeInteger(offset) || offset <= 0) return null;
    const previous = Math.max(0, offset - pageSize);
    return previous === 0 ? null : btoa(String(previous));
  } catch {
    return null;
  }
}

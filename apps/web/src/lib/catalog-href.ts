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

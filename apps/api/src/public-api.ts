import { catalogListInputSchema, type CatalogListInput } from "@dshhub/contracts";

function repeated(searchParams: URLSearchParams, singular: string, plural: string): string[] {
  const values = searchParams.getAll(singular);
  for (const value of searchParams.getAll(plural)) {
    values.push(...value.split(","));
  }
  return values.map(value => value.trim()).filter(Boolean);
}

export function parseCatalogListQuery(url: URL): CatalogListInput {
  const limit = url.searchParams.get("limit");
  return catalogListInputSchema.parse({
    query: url.searchParams.get("query") ?? url.searchParams.get("q") ?? "",
    categories: repeated(url.searchParams, "category", "categories"),
    compatibility: repeated(url.searchParams, "compatibility", "compatibilities"),
    sort: url.searchParams.get("sort") ?? undefined,
    cursor: url.searchParams.get("cursor"),
    limit: limit === null ? undefined : Number(limit),
    locale: url.searchParams.get("locale") ?? undefined,
  });
}

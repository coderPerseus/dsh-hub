import { describe, expect, it } from "vitest";

import { CatalogStore, toFtsQuery } from "../src/catalog-store";

function emptyDatabase(): D1Database {
  return {
    prepare: () => ({
      first: async () => null,
    }),
  } as unknown as D1Database;
}

describe("CatalogStore", () => {
  it("builds broad prefix queries while keeping FTS syntax quoted", () => {
    expect(toFtsQuery("image clipboard")).toBe('"image"* OR "clipboard"*');
    expect(toFtsQuery('say "hello"')).toBe('"say"* OR """hello"""*');
  });

  it("returns stable empty results before the first catalog is published", async () => {
    const store = new CatalogStore(emptyDatabase());

    await expect(store.meta()).resolves.toEqual({
      snapshotId: null,
      generatedAt: null,
      publishedAt: null,
      pluginCount: 0,
    });
    await expect(store.categories()).resolves.toEqual([]);
    await expect(store.detail("owner", "plugin")).resolves.toBeNull();
    await expect(store.list({
      query: "",
      categories: [],
      compatibility: [],
      sort: "featured",
      cursor: null,
      limit: 24,
    })).resolves.toEqual({ items: [], nextCursor: null, total: 0 });
  });
});

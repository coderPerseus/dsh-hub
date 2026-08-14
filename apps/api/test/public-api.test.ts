import { describe, expect, it } from "vitest";

import { parseCatalogListQuery } from "../src/public-api";

describe("public catalog API", () => {
  it("parses agent-friendly aliases and repeated filters", () => {
    expect(parseCatalogListQuery(new URL(
      "https://dshhub.org/v1/plugins?q=memory&category=skills&categories=agents,productivity&limit=5",
    ))).toMatchObject({
      query: "memory",
      categories: ["skills", "agents", "productivity"],
      limit: 5,
    });
  });

  it("rejects invalid limits", () => {
    expect(() => parseCatalogListQuery(
      new URL("https://dshhub.org/v1/plugins?limit=500"),
    )).toThrow();
  });
});

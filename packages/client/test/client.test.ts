import { describe, expect, it } from "vitest";

import { DshHubClient } from "../src/index";

describe("DshHubClient", () => {
  it("encodes structured search filters", async () => {
    let requested: URL | undefined;
    const client = new DshHubClient({
      baseUrl: "https://example.com/v1/",
      fetch: async (input) => {
        requested = new URL(input instanceof Request ? input.url : input.toString());
        return Response.json({ items: [], nextCursor: null, total: 0 });
      },
    });

    await client.search({
      query: "token cost",
      categories: ["finance", "interface"],
      compatibility: ["compatible"],
      limit: 5,
    });

    expect(requested?.pathname).toBe("/v1/plugins");
    expect(requested?.searchParams.get("query")).toBe("token cost");
    expect(requested?.searchParams.getAll("category")).toEqual(["finance", "interface"]);
    expect(requested?.searchParams.get("limit")).toBe("5");
  });

  it("returns null for a missing plugin", async () => {
    const client = new DshHubClient({
      fetch: async () => Response.json({ error: "Plugin not found" }, { status: 404 }),
    });

    await expect(client.plugin("owner/missing")).resolves.toBeNull();
  });
});

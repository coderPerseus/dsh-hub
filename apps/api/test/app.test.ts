import { describe, expect, it } from "vitest";

import { app } from "../src/index";

describe("API", () => {
  it("returns its health state", async () => {
    const response = await app.request("/health");

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      service: "dshhub-api",
      status: "ok",
    });
  });

  it("returns JSON for unknown routes", async () => {
    const response = await app.request("/missing");

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: "Not found" });
  });

  it("protects the catalog import endpoint", async () => {
    const response = await app.request("/internal/catalog-imports", { method: "POST" });

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("rejects invalid public catalog queries before accessing storage", async () => {
    const response = await app.request("/v1/plugins?limit=500");

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({ error: "Invalid query" });
  });
});

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
});

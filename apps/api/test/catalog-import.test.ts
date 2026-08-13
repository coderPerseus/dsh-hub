import { describe, expect, it } from "vitest";

import {
  authorizeCatalogImport,
  importCatalogSnapshot,
  readCatalogSnapshot,
  type CatalogBindings,
} from "../src/catalog-import";

describe("catalog import authentication", () => {
  it("accepts only the configured bearer token", async () => {
    await expect(authorizeCatalogImport("Bearer expected", "expected")).resolves.toBe(true);
    await expect(authorizeCatalogImport("Bearer wrong", "expected")).resolves.toBe(false);
    await expect(authorizeCatalogImport(undefined, "expected")).resolves.toBe(false);
  });
});

describe("catalog snapshot request", () => {
  it("rejects invalid snapshot JSON before storage", async () => {
    const request = new Request("https://example.com/import", {
      method: "POST",
      body: JSON.stringify({ schemaVersion: 99 }),
    });

    await expect(readCatalogSnapshot(request)).rejects.toThrow();
  });

  it("returns the validated snapshot and a stable content hash", async () => {
    const payload = JSON.stringify({
      schemaVersion: 1,
      snapshotId: "snapshot-1",
      generatedAt: "2026-08-14T00:00:00.000Z",
      source: { repository: "owner/catalog", commit: "abc123" },
      mainline: null,
      plugins: [],
    });
    const first = await readCatalogSnapshot(new Request("https://example.com/import", {
      method: "POST",
      body: payload,
    }));
    const second = await readCatalogSnapshot(new Request("https://example.com/import", {
      method: "POST",
      body: payload,
    }));

    expect(first.snapshot.snapshotId).toBe("snapshot-1");
    expect(first.hash).toBe(second.hash);
  });
});

describe("catalog snapshot importer", () => {
  it("activates a run only after its snapshot has been read and staged", async () => {
    const statements: string[] = [];
    const batches: string[][] = [];
    const prepare = (sql: string) => {
      const statement = {
        sql,
        bind: (..._values: unknown[]) => statement,
        run: async () => {
          statements.push(sql);
          return { success: true };
        },
      };
      return statement;
    };
    const db = {
      prepare,
      batch: async (items: Array<{ sql: string }>) => {
        batches.push(items.map(item => item.sql));
        return [];
      },
    };
    const snapshot = {
      schemaVersion: 1,
      snapshotId: "snapshot-1",
      generatedAt: "2026-08-14T00:00:00.000Z",
      source: { repository: "owner/catalog", commit: "abc123" },
      mainline: null,
      plugins: [],
    };
    const env = {
      DB: db,
      STORAGE: { get: async () => ({ json: async () => snapshot }) },
    } as unknown as CatalogBindings;

    await importCatalogSnapshot(env, { runId: "run-1", r2Key: "catalog/snapshot.json" });

    expect(statements[0]).toContain("status = 'importing'");
    expect(batches.at(-1)?.at(-1)).toContain("status = 'current'");
  });
});

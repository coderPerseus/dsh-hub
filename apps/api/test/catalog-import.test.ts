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
  it("ignores a queue message that another delivery already claimed", async () => {
    let storageReads = 0;
    const statement = {
      bind: (..._values: unknown[]) => statement,
      first: async () => ({ status: "current" }),
      run: async () => ({ success: true, meta: { changes: 0 } }),
    };
    const env = {
      DB: { prepare: () => statement },
      STORAGE: {
        get: async () => {
          storageReads += 1;
          return null;
        },
      },
    } as unknown as CatalogBindings;

    await expect(importCatalogSnapshot(env, {
      runId: "current-run",
      r2Key: "catalog/replayed.json",
    })).resolves.toBe("duplicate");

    expect(storageReads).toBe(0);
  });

  it("keeps retrying a queue message while another delivery is importing it", async () => {
    const statement = {
      bind: (..._values: unknown[]) => statement,
      first: async () => ({ status: "importing" }),
      run: async () => ({ success: true, meta: { changes: 0 } }),
    };
    const env = {
      DB: { prepare: () => statement },
      STORAGE: { get: async () => null },
    } as unknown as CatalogBindings;

    await expect(importCatalogSnapshot(env, {
      runId: "active-run",
      r2Key: "catalog/active.json",
    })).resolves.toBe("busy");
  });

  it("activates a run only after its snapshot has been read and staged", async () => {
    const statements: string[] = [];
    const batches: string[][] = [];
    const prepare = (sql: string) => {
      const statement = {
        sql,
        bind: (..._values: unknown[]) => statement,
        run: async () => {
          statements.push(sql);
          return { success: true, meta: { changes: 1 } };
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

  it("updates only changed repositories when a current catalog exists", async () => {
    const batches: string[][] = [];
    const prepare = (sql: string) => {
      const statement = {
        sql,
        bind: (..._values: unknown[]) => statement,
        first: async () => sql.includes("WHERE status = 'current'")
          ? { id: "current-run" }
          : sql.includes("COUNT(*)") ? { count: 7 } : null,
        run: async () => ({ success: true, meta: { changes: 1 } }),
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
      snapshotId: "snapshot-2",
      generatedAt: "2026-08-14T01:00:00.000Z",
      changedRepositories: ["owner/plugin"],
      source: { repository: "owner/catalog", commit: "def456" },
      mainline: null,
      plugins: [],
    };
    const env = {
      DB: db,
      STORAGE: { get: async () => ({ json: async () => snapshot }) },
    } as unknown as CatalogBindings;

    await importCatalogSnapshot(env, { runId: "delta-run", r2Key: "catalog/delta.json" });

    expect(batches.flat().some(sql => sql.includes("DELETE FROM plugin_snapshots"))).toBe(true);
    expect(batches.flat().some(sql => sql.includes("status = 'archived'"))).toBe(true);
    expect(batches.flat().some(sql => sql.includes("status = 'current'"))).toBe(false);
  });

  it("stages a batch group without changing the current run before the final batch", async () => {
    const batches: string[][] = [];
    const prepare = (sql: string) => {
      const statement = {
        sql,
        bind: (..._values: unknown[]) => statement,
        first: async () => sql.includes("WHERE status = 'current'")
          ? { id: "current-run" }
          : null,
        run: async () => ({ success: true, meta: { changes: 1 } }),
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
      snapshotId: "snapshot-3:batch:000001",
      generatedAt: "2026-08-14T02:00:00.000Z",
      changedRepositories: ["owner/plugin"],
      source: { repository: "owner/catalog", commit: "ghi789" },
      mainline: null,
      plugins: [],
      importBatch: {
        advancesCursor: true,
        expectedPluginCount: 1,
        id: "snapshot-3",
        index: 1,
        total: 2,
      },
    };
    const env = {
      DB: db,
      STORAGE: { get: async () => ({ json: async () => snapshot }) },
    } as unknown as CatalogBindings;

    await importCatalogSnapshot(env, { runId: "staging-run", r2Key: "catalog/batch-1.json" });

    expect(batches.flat().some(sql => (
      sql.includes("INSERT INTO plugin_snapshots") && sql.includes("SELECT")
    ))).toBe(true);
    expect(batches.flat().some(sql => sql.includes("status = 'current'"))).toBe(false);
  });

  it("deletes changed repositories in set-based batches", async () => {
    const batches: string[][] = [];
    const prepare = (sql: string) => {
      const statement = {
        sql,
        bind: (..._values: unknown[]) => statement,
        first: async () => sql.includes("WHERE status = 'current'")
          ? { id: "current-run" }
          : sql.includes("COUNT(*)") ? { count: 5 } : null,
        run: async () => ({ success: true, meta: { changes: 1 } }),
      };
      return statement;
    };
    const snapshot = {
      schemaVersion: 1,
      snapshotId: "snapshot-set-based",
      generatedAt: "2026-08-14T02:30:00.000Z",
      changedRepositories: ["owner/one", "owner/two"],
      source: { repository: "owner/catalog", commit: "set123" },
      mainline: null,
      plugins: [],
    };
    const env = {
      DB: {
        prepare,
        batch: async (items: Array<{ sql: string }>) => {
          batches.push(items.map(item => item.sql));
          return [];
        },
      },
      STORAGE: { get: async () => ({ json: async () => snapshot }) },
    } as unknown as CatalogBindings;

    await importCatalogSnapshot(env, { runId: "delta-run", r2Key: "catalog/set-based.json" });

    const deletes = batches.flat().filter(sql => sql.startsWith("DELETE FROM plugin_"));
    expect(deletes).toHaveLength(3);
    expect(deletes.every(sql => sql.includes(" OR "))).toBe(true);
  });

  it("does not finalize a batch group with missing intermediate parts", async () => {
    const prepare = (sql: string) => {
      const statement = {
        bind: (..._values: unknown[]) => statement,
        first: async () => sql.includes("COUNT(*) AS count") ? { count: 1 } : null,
        run: async () => ({ success: true, meta: { changes: 1 } }),
      };
      return statement;
    };
    const snapshot = {
      schemaVersion: 1,
      snapshotId: "snapshot-4:batch:000003",
      generatedAt: "2026-08-14T03:00:00.000Z",
      changedRepositories: ["owner/plugin"],
      source: { repository: "owner/catalog", commit: "jkl012" },
      mainline: null,
      plugins: [],
      importBatch: {
        advancesCursor: true,
        expectedPluginCount: 1,
        id: "snapshot-4",
        index: 3,
        total: 3,
      },
    };
    const env = {
      DB: { prepare, batch: async () => [] },
      STORAGE: { get: async () => ({ json: async () => snapshot }) },
    } as unknown as CatalogBindings;

    await expect(importCatalogSnapshot(env, {
      runId: "final-run",
      r2Key: "catalog/batch-3.json",
    })).rejects.toThrow(/missing a completed part/);
  });

  it("switches the staged projection only when the final batch completes", async () => {
    const batches: string[][] = [];
    const prepare = (sql: string) => {
      const statement = {
        sql,
        bind: (..._values: unknown[]) => statement,
        first: async () => sql.includes("SELECT generated_at")
          ? { generated_at: "2026-08-14T02:00:00.000Z" }
          : sql.includes("WHERE status = 'current'")
            ? { id: "current-run" }
            : sql.includes("COUNT(*)") ? { count: 8 } : null,
        run: async () => ({ success: true, meta: { changes: 1 } }),
      };
      return statement;
    };
    const snapshot = {
      schemaVersion: 1,
      snapshotId: "snapshot-5:batch:000001",
      generatedAt: "2026-08-14T04:00:00.000Z",
      changedRepositories: [],
      source: { repository: "owner/catalog", commit: "mno345" },
      mainline: null,
      plugins: [],
      importBatch: {
        advancesCursor: true,
        expectedPluginCount: 8,
        id: "snapshot-5",
        index: 1,
        total: 1,
      },
    };
    const env = {
      DB: {
        prepare,
        batch: async (items: Array<{ sql: string }>) => {
          batches.push(items.map(item => item.sql));
          return [];
        },
      },
      STORAGE: { get: async () => ({ json: async () => snapshot }) },
    } as unknown as CatalogBindings;

    await importCatalogSnapshot(env, { runId: "staging-run", r2Key: "catalog/final.json" });

    expect(batches.at(-1)?.some(sql => sql.includes("snapshot_id = ?"))).toBe(true);
    expect(batches.at(-1)?.some(sql => sql.includes("status = 'current'"))).toBe(true);
  });

  it("rejects a staged projection whose final count differs from the snapshot", async () => {
    const prepare = (sql: string) => {
      const statement = {
        bind: (..._values: unknown[]) => statement,
        first: async () => sql.includes("SELECT generated_at")
          ? { generated_at: "2026-08-14T02:00:00.000Z" }
          : sql.includes("WHERE status = 'current'")
            ? { id: "current-run" }
            : sql.includes("COUNT(*)") ? { count: 35 } : null,
        run: async () => ({ success: true, meta: { changes: 1 } }),
      };
      return statement;
    };
    const snapshot = {
      schemaVersion: 1,
      snapshotId: "snapshot-guard:batch:000001",
      generatedAt: "2026-08-14T05:00:00.000Z",
      changedRepositories: ["owner/plugin"],
      source: { repository: "owner/catalog", commit: "guard123" },
      mainline: null,
      plugins: [],
      importBatch: {
        advancesCursor: true,
        expectedPluginCount: 7_503,
        id: "snapshot-guard",
        index: 1,
        total: 1,
      },
    };
    const env = {
      DB: { prepare, batch: async () => [] },
      STORAGE: { get: async () => ({ json: async () => snapshot }) },
    } as unknown as CatalogBindings;

    await expect(importCatalogSnapshot(env, {
      runId: "staging-run",
      r2Key: "catalog/guard.json",
    })).rejects.toThrow("expected 7503 plugins but staged 35");
  });
});

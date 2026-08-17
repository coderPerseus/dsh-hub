import { describe, expect, it, vi } from "vitest";

import { createCatalogImportBatches } from "../src/import";
import { catalogPluginSchema, type CatalogPlugin, type CatalogSnapshot } from "../src/schema";

function plugin(repository: string, markdown = "usage"): CatalogPlugin {
  const [owner, name] = repository.split("/");
  return catalogPluginSchema.parse({
    id: `github:${repository}`,
    slug: repository,
    name: `dsh-${name}`,
    description: "Plugin description",
    repository: {
      owner,
      name,
      url: `https://github.com/${repository}`,
      defaultBranch: "main",
      commit: "abc123",
      stars: 1,
      license: "MIT",
      topics: ["dsh-plugin"],
      pushedAt: "2026-08-14T00:00:00.000Z",
      homepage: null,
    },
    package: {
      name: `dsh-${name}`,
      version: "1.0.0",
      hasBundle: false,
      bundlePatch: null,
      hasPrepareScript: false,
      peerDependencies: {},
    },
    categories: ["other"],
    featured: false,
    compatibility: {
      status: "unknown",
      level: "unverified",
      harnessRange: null,
      cordisRange: null,
      checks: [],
    },
    installation: {
      kind: "manual",
      spec: null,
      command: null,
      markdown: "install",
      notes: [],
    },
    usage: {
      summary: "Plugin description",
      markdown,
      readmeUrl: `https://github.com/${repository}#readme`,
    },
  });
}

function snapshot(plugins: CatalogPlugin[], changedRepositories?: string[]): CatalogSnapshot {
  return {
    schemaVersion: 1,
    snapshotId: "snapshot-1",
    generatedAt: "2026-08-14T00:00:00.000Z",
    changedRepositories,
    source: { repository: "owner/catalog", commit: "abc123" },
    mainline: null,
    plugins,
  };
}

describe("catalog import batches", () => {
  it("omits unchanged historical plugins from incremental imports", () => {
    const batches = createCatalogImportBatches(snapshot([
      plugin("owner/changed"),
      plugin("owner/unchanged"),
    ], ["owner/changed"]), 10_000);

    expect(batches).toHaveLength(1);
    expect(batches[0]?.changedRepositories).toEqual(["owner/changed"]);
    expect(batches[0]?.plugins.map(item => item.id)).toEqual(["github:owner/changed"]);
    expect(batches[0]?.importBatch).toEqual({
      advancesCursor: true,
      id: "snapshot-1",
      index: 1,
      total: 1,
    });
  });

  it("splits large deltas into compact requests below the byte limit", () => {
    const input = snapshot([
      plugin("owner/one", "a".repeat(700)),
      plugin("owner/two", "b".repeat(700)),
    ], ["owner/one", "owner/two"]);
    const oneRepositoryBytes = Buffer.byteLength(JSON.stringify({
      ...input,
      snapshotId: `${input.snapshotId}:batch:000001`,
      changedRepositories: ["owner/one"],
      plugins: [input.plugins[0]],
      importBatch: { advancesCursor: true, id: input.snapshotId, index: 1, total: 999_999 },
    }));
    const batches = createCatalogImportBatches(input, oneRepositoryBytes + 10);

    expect(batches).toHaveLength(2);
    expect(batches.map(batch => batch.snapshotId)).toEqual([
      "snapshot-1:batch:000001",
      "snapshot-1:batch:000002",
    ]);
    expect(batches.every(batch => Buffer.byteLength(JSON.stringify(batch)) <= oneRepositoryBytes + 10)).toBe(true);
  });

  it("splits an oversized initial snapshot into repository batches", () => {
    const input = snapshot([
      plugin("owner/one", "a".repeat(700)),
      plugin("owner/two", "b".repeat(700)),
    ]);
    const oneRepositoryBytes = Buffer.byteLength(JSON.stringify({
      ...input,
      snapshotId: `${input.snapshotId}:batch:000001`,
      changedRepositories: ["owner/one"],
      plugins: [input.plugins[0]],
      importBatch: { advancesCursor: true, id: input.snapshotId, index: 1, total: 999_999 },
    }));
    const batches = createCatalogImportBatches(input, oneRepositoryBytes + 10);

    expect(batches).toHaveLength(2);
    expect(batches.flatMap(batch => batch.changedRepositories)).toEqual([
      "owner/one",
      "owner/two",
    ]);
  });

  it("isolates a repository that cannot fit in one request", () => {
    const warning = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const batches = createCatalogImportBatches(snapshot([
      plugin("owner/large", "x".repeat(2_000)),
    ], ["owner/large"]), 500);

    expect(batches).toHaveLength(1);
    expect(batches[0]?.changedRepositories).toEqual([]);
    expect(batches[0]?.plugins).toEqual([]);
    expect(batches[0]?.importBatch?.advancesCursor).toBe(false);
    expect(warning).toHaveBeenCalledWith(expect.stringContaining("owner/large"));
    warning.mockRestore();
  });
});

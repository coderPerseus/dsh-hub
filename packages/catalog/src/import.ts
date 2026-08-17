import type { CatalogPlugin, CatalogSnapshot } from "./schema";

function jsonByteLength(value: unknown): number {
  return new TextEncoder().encode(JSON.stringify(value)).byteLength;
}

function repositoryName(plugin: CatalogPlugin): string {
  return `${plugin.repository.owner}/${plugin.repository.name}`.toLowerCase();
}

export function createCatalogImportBatches(
  snapshot: CatalogSnapshot,
  maximumBytes: number,
): CatalogSnapshot[] {
  if (!Number.isSafeInteger(maximumBytes) || maximumBytes < 1) {
    throw new Error("Catalog import byte limit must be a positive integer.");
  }

  if (snapshot.changedRepositories === undefined && jsonByteLength(snapshot) <= maximumBytes) {
    return [snapshot];
  }

  const selectedRepositories = snapshot.changedRepositories ?? snapshot.plugins.map(repositoryName);
  const repositories = [...new Map(selectedRepositories.map(repository => (
    [repository.toLowerCase(), repository] as const
  ))).values()];
  const selectedRepositoryNames = new Set(repositories.map(repository => repository.toLowerCase()));
  const pluginsByRepository = new Map<string, CatalogPlugin[]>();
  for (const plugin of snapshot.plugins) {
    const repository = repositoryName(plugin);
    if (!selectedRepositoryNames.has(repository)) continue;
    pluginsByRepository.set(repository, [...(pluginsByRepository.get(repository) ?? []), plugin]);
  }

  if (repositories.length === 0) {
    return [{
      ...snapshot,
      snapshotId: `${snapshot.snapshotId}:batch:000001`,
      changedRepositories: [],
      plugins: [],
      importBatch: { advancesCursor: true, id: snapshot.snapshotId, index: 1, total: 1 },
    }];
  }

  const batches: CatalogSnapshot[] = [];
  let batchRepositories: string[] = [];
  let batchPlugins: CatalogPlugin[] = [];
  let batchBytes = 0;
  let skippedRepository = false;

  const createBatchSnapshot = (index: number, changedRepositories: string[], plugins: CatalogPlugin[]) => ({
    ...snapshot,
    snapshotId: `${snapshot.snapshotId}:batch:${String(index).padStart(6, "0")}`,
    changedRepositories,
    plugins,
    importBatch: { advancesCursor: true, id: snapshot.snapshotId, index, total: 999_999 },
  });
  const flush = () => {
    batches.push(createBatchSnapshot(batches.length + 1, batchRepositories, batchPlugins));
    batchRepositories = [];
    batchPlugins = [];
    batchBytes = jsonByteLength(createBatchSnapshot(batches.length + 1, [], []));
  };
  batchBytes = jsonByteLength(createBatchSnapshot(1, [], []));
  const emptyBatchBytes = batchBytes;

  for (const repository of repositories) {
    const repositoryPlugins = pluginsByRepository.get(repository.toLowerCase()) ?? [];
    const repositoryBytes = jsonByteLength(repository) + (batchRepositories.length > 0 ? 1 : 0);
    const pluginBytes = repositoryPlugins.reduce(
      (total, plugin, index) => total + jsonByteLength(plugin)
        + (batchPlugins.length > 0 || index > 0 ? 1 : 0),
      0,
    );
    const addedBytes = repositoryBytes + pluginBytes;
    const singleBatchAddedBytes = jsonByteLength(repository) + repositoryPlugins.reduce(
      (total, plugin, index) => total + jsonByteLength(plugin) + (index > 0 ? 1 : 0),
      0,
    );
    if (emptyBatchBytes + singleBatchAddedBytes > maximumBytes) {
      console.warn(`Skipped catalog repository ${repository}: its import projection exceeds the byte limit.`);
      skippedRepository = true;
      continue;
    }
    if (batchBytes + addedBytes <= maximumBytes) {
      batchRepositories.push(repository);
      batchPlugins.push(...repositoryPlugins);
      batchBytes += addedBytes;
      continue;
    }
    flush();
    batchRepositories.push(repository);
    batchPlugins.push(...repositoryPlugins);
    batchBytes += singleBatchAddedBytes;
  }
  if (batchRepositories.length > 0) flush();

  if (batches.length === 0) {
    return [{
      ...snapshot,
      snapshotId: `${snapshot.snapshotId}:batch:000001`,
      changedRepositories: [],
      plugins: [],
      importBatch: { advancesCursor: !skippedRepository, id: snapshot.snapshotId, index: 1, total: 1 },
    }];
  }

  return batches.map((batch, index) => ({
    ...batch,
    importBatch: {
      advancesCursor: !skippedRepository,
      id: snapshot.snapshotId,
      index: index + 1,
      total: batches.length,
    },
  }));
}

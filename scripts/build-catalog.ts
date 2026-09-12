import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  catalogSnapshotSchema,
  stripCatalogTranslations,
  type CatalogSnapshot,
} from "../packages/catalog/src";
import {
  discoverCatalogSnapshot,
  renderCatalogSection,
  replaceCatalogSection,
} from "../packages/catalog/src/node";

async function readPreviousSnapshot(minimumPluginCount: number): Promise<CatalogSnapshot | undefined> {
  if (process.env.CATALOG_FORCE_FULL === "true") return undefined;
  const filename = process.env.CATALOG_PREVIOUS_SNAPSHOT ?? path.resolve(process.cwd(), '../../.catalog/catalog.snapshot.json');
  const snapshot = catalogSnapshotSchema.parse(JSON.parse(await readFile(filename, 'utf8')));
  if (snapshot.plugins.length < minimumPluginCount) throw new Error('Previous catalog is incomplete; refusing data loss.');
  return snapshot;
}

async function main(): Promise<void> {
  const root = path.resolve(process.cwd(), "../..");
  const outputDirectory = path.join(root, ".catalog");
  const readmePath = path.join(root, "README.md");
  const sourceRepository = process.env.GITHUB_REPOSITORY ?? "local/dshhub";
  const sourceCommit = process.env.CATALOG_SOURCE_COMMIT
    ?? process.env.GITHUB_SHA
    ?? "local-development";
  const catalogMode = process.env.CATALOG_MODE === "refresh"
    ? "refresh"
    : process.env.CATALOG_MODE === "backfill" ? "backfill" : "discover";
  const discoverySinceValue = process.env.CATALOG_DISCOVERY_SINCE?.trim();
  const discoverySince = discoverySinceValue ? new Date(discoverySinceValue) : undefined;
  if (discoverySince && Number.isNaN(discoverySince.getTime())) {
    throw new Error("CATALOG_DISCOVERY_SINCE must be an ISO 8601 timestamp.");
  }
  if (catalogMode === "backfill" && !discoverySince) {
    throw new Error("CATALOG_DISCOVERY_SINCE is required in backfill mode.");
  }
  const targetRepository = process.env.CATALOG_REPOSITORY?.trim();
  if (targetRepository && !/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(targetRepository)) {
    throw new Error("CATALOG_REPOSITORY must use owner/repo format.");
  }

  const minimumPluginCount = Number(process.env.CATALOG_MIN_PLUGIN_COUNT ?? 50);
  if (!Number.isSafeInteger(minimumPluginCount) || minimumPluginCount < 1) {
    throw new Error("CATALOG_MIN_PLUGIN_COUNT must be a positive integer.");
  }
  const previousSnapshot = await readPreviousSnapshot(minimumPluginCount);
  const discoveredSnapshot = await discoverCatalogSnapshot({
    catalogMode,
    discoverySince,
    discoveryQueries: targetRepository ? [`repo:${targetRepository}`] : undefined,
    githubToken: process.env.GITHUB_TOKEN,
    minimumPluginCount,
    refreshLimit: 300,
    failOnDiscoveryError: true,
    previousSnapshot,
    source: { repository: sourceRepository, commit: sourceCommit },
  });
  const snapshot = stripCatalogTranslations(discoveredSnapshot);
  if (previousSnapshot && snapshot.plugins.length < previousSnapshot.plugins.length * 0.9) {
    throw new Error('Catalog lost more than 10% of plugins; keep the previous release and investigate.');
  }

  await mkdir(outputDirectory, { recursive: true });
  await writeFile(
    path.join(outputDirectory, "catalog.snapshot.json"),
    `${JSON.stringify(snapshot, null, 2)}\n`,
  );

  const readme = await readFile(readmePath, "utf8");
  await writeFile(
    readmePath,
    replaceCatalogSection(readme, renderCatalogSection(snapshot)),
  );

  console.log(`Built catalog snapshot ${snapshot.snapshotId} with ${snapshot.plugins.length} plugins.`);
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});

import { applyCatalogEnrichment, catalogEnrichmentDataSchema } from "../packages/catalog/src/enrichment";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  catalogSnapshotSchema,
  stripCatalogTranslations,
  type CatalogSnapshot,
} from "../packages/catalog/src";
import {
  availableRefreshLimit,
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
  const enrichmentDataPath = path.join(root, "data/catalog-enrichment.json");
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
  let refreshLimit = 300;
  if (catalogMode === 'refresh') {
    refreshLimit = await availableRefreshLimit(globalThis.fetch, process.env.GITHUB_TOKEN);
    console.log(`GitHub quota allows refreshing ${refreshLimit} repositories this run.`);
    if (refreshLimit === 0) {
      console.log('Preserving the catalog and refresh cursor until GitHub quota is available.');
      return;
    }
  }
  const discoveredSnapshot = await discoverCatalogSnapshot({
    catalogMode,
    discoverySince: discoverySince ?? (catalogMode === 'discover' && !targetRepository && previousSnapshot
      ? new Date(new Date(previousSnapshot.discoveryAt ?? previousSnapshot.generatedAt).getTime() - 5 * 60_000)
      : undefined),
    discoveryQueries: targetRepository ? [`repo:${targetRepository}`] : undefined,
    githubToken: process.env.GITHUB_TOKEN,
    minimumPluginCount,
    refreshLimit,
    failOnDiscoveryError: true,
    previousSnapshot,
    source: { repository: sourceRepository, commit: sourceCommit },
  });
  const snapshot = stripCatalogTranslations(discoveredSnapshot);
  let enrichedSnapshot = snapshot;
  try {
    const rawData = await readFile(enrichmentDataPath, "utf8");
    enrichedSnapshot = applyCatalogEnrichment(
      snapshot,
      catalogEnrichmentDataSchema.parse(JSON.parse(rawData)),
    );
  } catch (error) {
    if (error instanceof Error && "code" in error && (error as NodeJS.ErrnoException).code === "ENOENT") {
      console.warn("Skipping missing catalog enrichment sidecar: data/catalog-enrichment.json");
    } else {
      throw error;
    }
  }
  const snapshotWithEnrichment = enrichedSnapshot;
  if (targetRepository && previousSnapshot) {
    // Inspecting one submission must not skip repositories in the next global scan.
    snapshotWithEnrichment.discoveryAt = previousSnapshot.discoveryAt ?? previousSnapshot.generatedAt;
  }
  if (previousSnapshot && snapshotWithEnrichment.plugins.length < previousSnapshot.plugins.length * 0.9) {
    throw new Error('Catalog lost more than 10% of plugins; keep the previous release and investigate.');
  }

  await mkdir(outputDirectory, { recursive: true });
  await writeFile(
    path.join(outputDirectory, "catalog.snapshot.json"),
    `${JSON.stringify(snapshotWithEnrichment, null, 2)}\n`,
  );

  const readme = await readFile(readmePath, "utf8");
  await writeFile(
    readmePath,
    replaceCatalogSection(readme, renderCatalogSection(snapshotWithEnrichment)),
  );

  console.log(`Built catalog snapshot ${snapshot.snapshotId} with ${snapshot.plugins.length} plugins.`);
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  catalogSnapshotSchema,
  type CatalogSnapshot,
} from "../packages/catalog/src";
import {
  discoverCatalogSnapshot,
  renderCatalogSection,
  replaceCatalogSection,
} from "../packages/catalog/src/node";

async function readPreviousSnapshot(minimumPluginCount: number): Promise<CatalogSnapshot | undefined> {
  if (process.env.CATALOG_FORCE_FULL === "true") return undefined;
  const apiUrl = process.env.CATALOG_API_URL?.trim();
  const token = process.env.CATALOG_INGEST_TOKEN?.trim();
  if (!apiUrl || !token) return undefined;
  const response = await fetch(
    new URL("internal/catalog-snapshot", `${apiUrl.replace(/\/$/, "")}/`),
    {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(30_000),
    },
  );
  if (response.status === 404) return undefined;
  if (!response.ok) throw new Error(`Catalog API returned ${response.status} while reading the previous snapshot.`);
  const snapshot = catalogSnapshotSchema.parse(await response.json());
  return snapshot.plugins.length >= minimumPluginCount ? snapshot : undefined;
}

async function main(): Promise<void> {
  const root = path.resolve(process.cwd(), "../..");
  const outputDirectory = path.join(root, ".catalog");
  const readmePath = path.join(root, "README.md");
  const sourceRepository = process.env.GITHUB_REPOSITORY ?? "local/dshhub";
  const sourceCommit = process.env.GITHUB_SHA ?? "local-development";
  const catalogMode = process.env.CATALOG_MODE === "refresh" ? "refresh" : "discover";
  const targetRepository = process.env.CATALOG_REPOSITORY?.trim();
  if (targetRepository && !/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(targetRepository)) {
    throw new Error("CATALOG_REPOSITORY must use owner/repo format.");
  }

  const minimumPluginCount = Number(process.env.CATALOG_MIN_PLUGIN_COUNT ?? 50);
  if (!Number.isSafeInteger(minimumPluginCount) || minimumPluginCount < 1) {
    throw new Error("CATALOG_MIN_PLUGIN_COUNT must be a positive integer.");
  }
  const previousSnapshot = await readPreviousSnapshot(minimumPluginCount);
  const snapshot = await discoverCatalogSnapshot({
    catalogMode,
    discoveryQueries: targetRepository ? [`repo:${targetRepository}`] : undefined,
    githubToken: process.env.GITHUB_TOKEN,
    minimumPluginCount,
    previousSnapshot,
    source: { repository: sourceRepository, commit: sourceCommit },
  });

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

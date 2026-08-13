import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  discoverCatalogSnapshot,
  renderCatalogSection,
  replaceCatalogSection,
} from "../packages/catalog/src/node";

async function main(): Promise<void> {
  const root = path.resolve(process.cwd(), "../..");
  const outputDirectory = path.join(root, ".catalog");
  const readmePath = path.join(root, "README.md");
  const sourceRepository = process.env.GITHUB_REPOSITORY ?? "local/dshhub";
  const sourceCommit = process.env.GITHUB_SHA ?? "local-development";

  const minimumPluginCount = Number(process.env.CATALOG_MIN_PLUGIN_COUNT ?? 50);
  if (!Number.isSafeInteger(minimumPluginCount) || minimumPluginCount < 1) {
    throw new Error("CATALOG_MIN_PLUGIN_COUNT must be a positive integer.");
  }
  const snapshot = await discoverCatalogSnapshot({
    githubToken: process.env.GITHUB_TOKEN,
    minimumPluginCount,
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

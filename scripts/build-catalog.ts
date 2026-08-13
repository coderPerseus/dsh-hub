import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  buildCatalogSnapshot,
  loadRegistry,
  renderCatalogSection,
  replaceCatalogSection,
} from "../packages/catalog/src/node";

async function main(): Promise<void> {
  const root = path.resolve(process.cwd(), "../..");
  const registryDirectory = path.join(root, "registry");
  const outputDirectory = path.join(root, ".catalog");
  const readmePath = path.join(root, "README.md");
  const sourceRepository = process.env.GITHUB_REPOSITORY ?? "local/dshhub";
  const sourceCommit = process.env.GITHUB_SHA ?? "local-development";

  const entries = await loadRegistry(registryDirectory);
  const snapshot = await buildCatalogSnapshot(entries, {
    githubToken: process.env.GITHUB_TOKEN,
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

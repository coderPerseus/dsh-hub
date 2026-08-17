import { readFile } from "node:fs/promises";
import path from "node:path";

import {
  catalogSnapshotSchema,
  createCatalogImportBatches,
  type CatalogSnapshot,
} from "../packages/catalog/src";

type ImportStatus = {
  error?: string | null;
  runId?: string;
  status?: string;
};

const pendingStatuses = new Set(["queued", "importing"]);
const successfulStatuses = new Set(["current", "archived"]);
const MAX_IMPORT_BYTES = 18_000_000;

function requiredEnvironment(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

async function responseJson(response: Response): Promise<ImportStatus> {
  const text = await response.text();
  let value: ImportStatus;
  try {
    value = JSON.parse(text) as ImportStatus;
  } catch {
    throw new Error(`Catalog API returned ${response.status}: ${text.slice(0, 300)}`);
  }
  if (!response.ok) {
    throw new Error(`Catalog API returned ${response.status}: ${value.error ?? text.slice(0, 300)}`);
  }
  return value;
}

async function wait(milliseconds: number): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, milliseconds));
}

async function publishSnapshot(
  endpoint: URL,
  headers: { Authorization: string },
  snapshot: CatalogSnapshot,
): Promise<void> {
  const body = JSON.stringify(snapshot);
  const created = await responseJson(await fetch(endpoint, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body,
    signal: AbortSignal.timeout(30_000),
  }));
  if (!created.runId || !created.status) throw new Error("Catalog API did not return a run ID and status.");

  let status = created;
  for (let attempt = 0; pendingStatuses.has(status.status ?? "") && attempt < 60; attempt += 1) {
    await wait(2_000);
    status = await responseJson(await fetch(new URL(created.runId, `${endpoint.toString().replace(/\/$/, "")}/`), {
      headers,
      signal: AbortSignal.timeout(30_000),
    }));
  }

  if (!successfulStatuses.has(status.status ?? "")) {
    throw new Error(status.error ?? `Catalog import ended with status ${status.status ?? "unknown"}.`);
  }
  console.log(`Published catalog import ${created.runId} with status ${status.status}.`);
}

async function main(): Promise<void> {
  const apiUrl = new URL(requiredEnvironment("CATALOG_API_URL"));
  if (apiUrl.protocol !== "https:" && apiUrl.hostname !== "localhost") {
    throw new Error("CATALOG_API_URL must use HTTPS outside localhost.");
  }
  const token = requiredEnvironment("CATALOG_INGEST_TOKEN");
  const root = path.resolve(process.cwd(), "../..");
  const source = await readFile(path.join(root, ".catalog/catalog.snapshot.json"), "utf8");
  const snapshot = catalogSnapshotSchema.parse(JSON.parse(source));
  const batches = createCatalogImportBatches(snapshot, MAX_IMPORT_BYTES);
  const endpoint = new URL("internal/catalog-imports", `${apiUrl.toString().replace(/\/$/, "")}/`);
  const headers = { Authorization: `Bearer ${token}` };
  console.log(`Publishing ${snapshot.changedRepositories?.length ?? snapshot.plugins.length} changed repositories in ${batches.length} compact batch(es).`);
  for (const batch of batches) {
    await publishSnapshot(endpoint, headers, batch);
  }
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

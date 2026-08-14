import {
  catalogSearchText,
  catalogSnapshotSchema,
  i18nSearchText,
  type CatalogPlugin,
  type CatalogSnapshot,
} from "@dshhub/catalog";

export type CatalogImportMessage = {
  r2Key: string;
  runId: string;
};

export type CatalogBindings = CloudflareBindings & {
  CATALOG_INGEST_TOKEN?: string;
  CATALOG_QUEUE: Queue<CatalogImportMessage>;
};

const MAX_CATALOG_BYTES = 20_000_000;
const STATEMENT_BATCH_SIZE = 50;

function toHex(bytes: ArrayBuffer): string {
  return [...new Uint8Array(bytes)].map(byte => byte.toString(16).padStart(2, "0")).join("");
}

async function sha256(value: ArrayBuffer | string): Promise<string> {
  const input = typeof value === "string" ? new TextEncoder().encode(value) : value;
  return toHex(await crypto.subtle.digest("SHA-256", input));
}

async function secretsMatch(left: string, right: string): Promise<boolean> {
  const [leftHash, rightHash] = await Promise.all([sha256(left), sha256(right)]);
  let difference = leftHash.length ^ rightHash.length;
  for (let index = 0; index < Math.max(leftHash.length, rightHash.length); index += 1) {
    difference |= (leftHash.charCodeAt(index) || 0) ^ (rightHash.charCodeAt(index) || 0);
  }
  return difference === 0;
}

export async function authorizeCatalogImport(
  authorization: string | undefined,
  expectedToken: string | undefined,
): Promise<boolean> {
  if (!authorization?.startsWith("Bearer ") || !expectedToken) return false;
  return secretsMatch(authorization.slice("Bearer ".length), expectedToken);
}

export async function readCatalogSnapshot(request: Request): Promise<{
  bytes: ArrayBuffer;
  hash: string;
  snapshot: CatalogSnapshot;
}> {
  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (declaredLength > MAX_CATALOG_BYTES) throw new Error("Catalog snapshot exceeds 20 MB.");

  const bytes = await request.arrayBuffer();
  if (bytes.byteLength > MAX_CATALOG_BYTES) throw new Error("Catalog snapshot exceeds 20 MB.");

  let decoded: unknown;
  try {
    decoded = JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    throw new Error("Catalog snapshot is not valid JSON.");
  }

  return {
    bytes,
    hash: await sha256(bytes),
    snapshot: catalogSnapshotSchema.parse(decoded),
  };
}

async function runBatches(db: D1Database, statements: D1PreparedStatement[]): Promise<void> {
  for (let index = 0; index < statements.length; index += STATEMENT_BATCH_SIZE) {
    await db.batch(statements.slice(index, index + STATEMENT_BATCH_SIZE));
  }
}

async function clearRun(db: D1Database, runId: string): Promise<void> {
  await db.batch([
    db.prepare("DELETE FROM plugin_search WHERE run_id = ?").bind(runId),
    db.prepare("DELETE FROM plugin_categories WHERE run_id = ?").bind(runId),
    db.prepare("DELETE FROM plugin_snapshots WHERE run_id = ?").bind(runId),
  ]);
}

function pluginStatements(
  db: D1Database,
  runId: string,
  plugins: CatalogPlugin[],
): D1PreparedStatement[] {
  const statements: D1PreparedStatement[] = [];
  for (const plugin of plugins) {
    statements.push(db.prepare(
      `INSERT INTO plugin_snapshots (
        run_id, plugin_id, slug, owner, repo, name, package_name, description,
        compatibility_status, compatibility_level, stars, pushed_at, repository_url,
        featured, installation_json, compatibility_json, usage_summary, usage_markdown, raw_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).bind(
      runId,
      plugin.id,
      plugin.slug,
      plugin.repository.owner,
      plugin.repository.name,
      plugin.name,
      plugin.package.name,
      plugin.description,
      plugin.compatibility.status,
      plugin.compatibility.level,
      plugin.repository.stars,
      plugin.repository.pushedAt,
      plugin.repository.url,
      plugin.featured ? 1 : 0,
      JSON.stringify(plugin.installation),
      JSON.stringify(plugin.compatibility),
      plugin.usage.summary,
      plugin.usage.markdown,
      JSON.stringify(plugin),
    ));
    for (const category of plugin.categories) {
      statements.push(db.prepare(
        "INSERT INTO plugin_categories (run_id, plugin_id, category_id) VALUES (?, ?, ?)",
      ).bind(runId, plugin.id, category));
    }
    statements.push(db.prepare(
      `INSERT INTO plugin_search (
        run_id, plugin_id, name, package_name, description, topics, usage
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ).bind(
      runId,
      plugin.id,
      plugin.name,
      plugin.package.name,
      i18nSearchText(plugin),
      [...plugin.repository.topics, ...plugin.categories].join(" "),
      catalogSearchText(plugin),
    ));
  }
  return statements;
}

async function importIncrementalSnapshot(
  env: CatalogBindings,
  runId: string,
  snapshot: CatalogSnapshot,
  changedRepositories: string[],
  now: string,
): Promise<boolean> {
  const current = await env.DB.prepare(
    "SELECT id FROM catalog_runs WHERE status = 'current' ORDER BY published_at DESC LIMIT 1",
  ).first<{ id: string }>();
  if (current === null) return false;

  for (const repository of changedRepositories) {
    const [owner, repo] = repository.split("/");
    const refreshedPlugins = snapshot.plugins.filter(plugin => (
      plugin.repository.owner.toLowerCase() === owner?.toLowerCase()
      && plugin.repository.name.toLowerCase() === repo?.toLowerCase()
    ));
    const match = "run_id = ? AND lower(owner) = lower(?) AND lower(repo) = lower(?)";
    await runBatches(env.DB, [
      env.DB.prepare(`DELETE FROM plugin_search WHERE run_id = ? AND plugin_id IN (SELECT plugin_id FROM plugin_snapshots WHERE ${match})`).bind(current.id, current.id, owner, repo),
      env.DB.prepare(`DELETE FROM plugin_categories WHERE run_id = ? AND plugin_id IN (SELECT plugin_id FROM plugin_snapshots WHERE ${match})`).bind(current.id, current.id, owner, repo),
      env.DB.prepare(`DELETE FROM plugin_snapshots WHERE ${match}`).bind(current.id, owner, repo),
      ...pluginStatements(env.DB, current.id, refreshedPlugins),
    ]);
  }
  const count = await env.DB.prepare(
    "SELECT COUNT(*) AS count FROM plugin_snapshots WHERE run_id = ?",
  ).bind(current.id).first<{ count: number }>();
  await env.DB.batch([
    env.DB.prepare(
      `UPDATE catalog_runs SET plugin_count = ?, generated_at = ?, published_at = ?, updated_at = ?
       WHERE id = ?`,
    ).bind(count?.count ?? 0, snapshot.generatedAt, now, now, current.id),
    env.DB.prepare(
      `UPDATE catalog_runs SET status = 'archived', plugin_count = ?, published_at = ?, updated_at = ?, error = NULL
       WHERE id = ?`,
    ).bind(count?.count ?? 0, now, now, runId),
  ]);
  return true;
}

export async function importCatalogSnapshot(
  env: CatalogBindings,
  message: CatalogImportMessage,
): Promise<void> {
  const object = await env.STORAGE.get(message.r2Key);
  if (object === null) throw new Error(`Catalog object ${message.r2Key} is missing.`);

  const snapshot = catalogSnapshotSchema.parse(await object.json());
  const now = new Date().toISOString();
  await env.DB.prepare(
    "UPDATE catalog_runs SET status = 'importing', error = NULL, updated_at = ? WHERE id = ?",
  ).bind(now, message.runId).run();
  if (snapshot.changedRepositories && await importIncrementalSnapshot(
    env,
    message.runId,
    snapshot,
    snapshot.changedRepositories,
    now,
  )) return;
  await clearRun(env.DB, message.runId);

  await runBatches(env.DB, pluginStatements(env.DB, message.runId, snapshot.plugins));

  await env.DB.batch([
    env.DB.prepare(
      "UPDATE catalog_runs SET status = 'archived', updated_at = ? WHERE status = 'current' AND id <> ?",
    ).bind(now, message.runId),
    env.DB.prepare(
      `UPDATE catalog_runs
       SET status = 'current', plugin_count = ?, published_at = ?, updated_at = ?, error = NULL
       WHERE id = ?`,
    ).bind(snapshot.plugins.length, now, now, message.runId),
  ]);
}

export async function markCatalogImportFailed(
  db: D1Database,
  runId: string,
  error: unknown,
): Promise<void> {
  const message = error instanceof Error ? error.message : String(error);
  await db.prepare(
    "UPDATE catalog_runs SET status = 'failed', error = ?, updated_at = ? WHERE id = ?",
  ).bind(message.slice(0, 2_000), new Date().toISOString(), runId).run();
}

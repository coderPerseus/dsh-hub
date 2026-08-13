import { onError } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";
import { Hono } from "hono";
import { cors } from "hono/cors";

import { router } from "./router";
import {
  authorizeCatalogImport,
  importCatalogSnapshot,
  markCatalogImportFailed,
  readCatalogSnapshot,
  type CatalogBindings,
  type CatalogImportMessage,
} from "./catalog-import";

const app = new Hono<{ Bindings: CatalogBindings }>();
export { app };

app.use(
  "/rpc/*",
  cors({
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "OPTIONS"],
    origin: "*",
  }),
);

app.get("/", (c) =>
  c.json({
    name: "dshhub-api",
    rpc: "/rpc",
  }),
);

app.get("/health", (c) =>
  c.json({
    service: "dshhub-api",
    status: "ok",
    timestamp: new Date().toISOString(),
  }),
);

app.post("/internal/catalog-imports", async (c) => {
  if (!(await authorizeCatalogImport(c.req.header("authorization"), c.env?.CATALOG_INGEST_TOKEN))) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  let input: Awaited<ReturnType<typeof readCatalogSnapshot>>;
  try {
    input = await readCatalogSnapshot(c.req.raw);
  } catch (error) {
    return c.json({ error: error instanceof Error ? error.message : String(error) }, 400);
  }

  const existing = await c.env.DB.prepare(
    "SELECT id, status FROM catalog_runs WHERE sha256 = ?",
  ).bind(input.hash).first<{ id: string; status: string }>();
  if (existing !== null && existing.status !== "failed") {
    return c.json({ runId: existing.id, status: existing.status }, 200);
  }

  const runId = existing?.id ?? crypto.randomUUID();
  const r2Key = `catalog/${input.snapshot.generatedAt.slice(0, 10)}/${input.snapshot.snapshotId}.json`;
  const now = new Date().toISOString();
  await c.env.STORAGE.put(r2Key, input.bytes, {
    customMetadata: { sha256: input.hash, snapshotId: input.snapshot.snapshotId },
    httpMetadata: { contentType: "application/json" },
  });
  await c.env.DB.prepare(
    `INSERT INTO catalog_runs (
      id, snapshot_id, schema_version, source_repository, source_commit, mainline_commit,
      r2_key, sha256, status, plugin_count, generated_at, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'queued', ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      r2_key = excluded.r2_key, status = 'queued', error = NULL, updated_at = excluded.updated_at`,
  ).bind(
    runId,
    input.snapshot.snapshotId,
    input.snapshot.schemaVersion,
    input.snapshot.source.repository,
    input.snapshot.source.commit,
    input.snapshot.mainline?.commit ?? null,
    r2Key,
    input.hash,
    input.snapshot.plugins.length,
    input.snapshot.generatedAt,
    now,
    now,
  ).run();

  try {
    await c.env.CATALOG_QUEUE.send({ runId, r2Key });
  } catch (error) {
    await markCatalogImportFailed(c.env.DB, runId, error);
    throw error;
  }

  return c.json({ runId, status: "queued" }, 202);
});

app.get("/internal/catalog-imports/:runId", async (c) => {
  if (!(await authorizeCatalogImport(c.req.header("authorization"), c.env?.CATALOG_INGEST_TOKEN))) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  const run = await c.env.DB.prepare(
    `SELECT id, snapshot_id, status, plugin_count, generated_at, published_at, error
     FROM catalog_runs WHERE id = ?`,
  ).bind(c.req.param("runId")).first();
  return run === null ? c.json({ error: "Import not found" }, 404) : c.json(run);
});

const rpcHandler = new RPCHandler(router, {
  interceptors: [
    onError((error) => {
      console.error(
        JSON.stringify({
          error: error instanceof Error ? error.message : String(error),
          message: "oRPC request failed",
        }),
      );
    }),
  ],
});

app.use("/rpc/*", async (c, next) => {
  const { matched, response } = await rpcHandler.handle(c.req.raw, {
    context: { db: c.env.DB },
    prefix: "/rpc",
  });

  if (matched) {
    return c.newResponse(response.body, response);
  }

  await next();
});

app.notFound((c) => c.json({ error: "Not found" }, 404));

export default {
  fetch: app.fetch,
  async queue(batch: MessageBatch<CatalogImportMessage>, env: CatalogBindings) {
    await Promise.all(batch.messages.map(async (message) => {
      try {
        await importCatalogSnapshot(env, message.body);
        message.ack();
      } catch (error) {
        await markCatalogImportFailed(env.DB, message.body.runId, error);
        message.retry();
      }
    }));
  },
};

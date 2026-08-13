import { onError } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";
import { Hono } from "hono";
import { cors } from "hono/cors";

import { router } from "./router";

type AppEvent = {
  id: string;
  payload: Record<string, unknown>;
  type: string;
};

const app = new Hono<{ Bindings: CloudflareBindings }>();
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

app.post("/events", async (c) => {
  const body = await c.req.json<{ payload?: Record<string, unknown>; type?: string }>();
  const event: AppEvent = {
    id: crypto.randomUUID(),
    payload: body.payload ?? {},
    type: body.type?.trim() || "app.event",
  };

  await c.env.EVENT_QUEUE.send(event);
  return c.json({ accepted: true, eventId: event.id }, 202);
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
    context: {},
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
  async queue(batch: MessageBatch<AppEvent>, env: CloudflareBindings) {
    await Promise.all(
      batch.messages.map(async (message) => {
        const now = new Date().toISOString();
        await env.DB.prepare(
          `INSERT INTO events (id, type, payload, created_at, processed_at)
           VALUES (?, ?, ?, ?, ?) ON CONFLICT(id) DO NOTHING`,
        )
          .bind(
            message.body.id,
            message.body.type,
            JSON.stringify(message.body.payload),
            now,
            now,
          )
          .run();
        message.ack();
      }),
    );
  },
};

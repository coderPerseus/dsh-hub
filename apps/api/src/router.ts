import { appContract } from "@dshhub/contracts";
import { implement } from "@orpc/server";

const os = implement(appContract);

const health = os.system.health.handler(() => ({
  service: "dshhub-api",
  status: "ok",
  timestamp: new Date().toISOString(),
}));

const hello = os.greeting.hello.handler(({ input }) => ({
  message: `你好，${input.name}！`,
}));

export const router = os.router({
  greeting: {
    hello,
  },
  system: {
    health,
  },
});

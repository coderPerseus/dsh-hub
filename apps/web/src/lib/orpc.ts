import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { ContractRouterClient } from "@orpc/contract";
import { appContract } from "@dshhub/contracts";
import { getCloudflareContext } from "@opennextjs/cloudflare";

const apiUrl = (process.env.API_URL ?? "http://localhost:8787").replace(
  /\/$/,
  "",
);

const link = new RPCLink({
  url: `${apiUrl}/rpc`,
  fetch: async (request, init) => {
    try {
      const { env } = await getCloudflareContext({ async: true });
      if (env.API) return env.API.fetch(request, init);
    } catch {
      // Plain Next.js builds and runtimes do not expose Cloudflare bindings.
    }
    return fetch(request, init);
  },
});

export const orpc: ContractRouterClient<typeof appContract> = createORPCClient(link);

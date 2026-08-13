import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { ContractRouterClient } from "@orpc/contract";
import { appContract } from "@dshhub/contracts";

const apiUrl = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8787").replace(
  /\/$/,
  "",
);

const link = new RPCLink({
  url: `${apiUrl}/rpc`,
});

export const orpc: ContractRouterClient<typeof appContract> = createORPCClient(link);

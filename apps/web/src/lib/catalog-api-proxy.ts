import { getCloudflareContext } from "@opennextjs/cloudflare";

const apiUrl = (process.env.API_URL ?? "http://localhost:8787").replace(/\/$/, "");

export async function proxyCatalogApi(request: Request, path: string): Promise<Response> {
  const incoming = new URL(request.url);
  const target = new URL(path, `${apiUrl}/`);
  target.search = incoming.search;
  const init = {
    headers: { Accept: "application/json" },
    signal: request.signal,
  };
  try {
    const { env } = await getCloudflareContext({ async: true });
    if (env.API) return env.API.fetch(target, init);
  } catch {
    // Plain Next.js runtimes do not expose Cloudflare service bindings.
  }
  return fetch(target, init);
}

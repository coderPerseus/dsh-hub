import { proxyCatalogApi } from "../../../../../../lib/catalog-api-proxy";

type PluginRouteContext = {
  params: Promise<{ owner: string; repository: string }>;
};

export async function GET(request: Request, context: PluginRouteContext): Promise<Response> {
  const { owner, repository } = await context.params;
  return proxyCatalogApi(
    request,
    `/v1/plugins/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}`,
  );
}

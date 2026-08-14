import { proxyCatalogApi } from "../../../../lib/catalog-api-proxy";

export async function GET(request: Request): Promise<Response> {
  return proxyCatalogApi(request, "/v1/plugins");
}

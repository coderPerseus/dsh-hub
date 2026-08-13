import { appContract } from "@dshhub/contracts";
import { implement } from "@orpc/server";

import { CatalogStore } from "./catalog-store";

type RouterContext = { db: D1Database };

const os = implement(appContract).$context<RouterContext>();

const catalogMeta = os.catalog.meta.handler(({ context }) => new CatalogStore(context.db).meta());
const catalogList = os.catalog.list.handler(({ context, input }) => (
  new CatalogStore(context.db).list(input)
));
const catalogDetail = os.catalog.detail.handler(({ context, input }) => (
  new CatalogStore(context.db).detail(input.owner, input.repository, input.locale)
));
const catalogCategories = os.catalog.categories.handler(({ context }) => (
  new CatalogStore(context.db).categories()
));

const health = os.system.health.handler(() => ({
  service: "dshhub-api",
  status: "ok",
  timestamp: new Date().toISOString(),
}));

const hello = os.greeting.hello.handler(({ input }) => ({
  message: `你好，${input.name}！`,
}));

export const router = os.router({
  catalog: {
    categories: catalogCategories,
    detail: catalogDetail,
    list: catalogList,
    meta: catalogMeta,
  },
  greeting: {
    hello,
  },
  system: {
    health,
  },
});

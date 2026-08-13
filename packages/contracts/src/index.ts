import { oc } from "@orpc/contract";
import { catalogLocaleSchema, catalogPluginSchema } from "@dshhub/catalog";
import { z } from "zod";

const compatibilityStatusSchema = z.enum(["compatible", "incompatible", "unknown"]);
const compatibilityLevelSchema = z.enum(["unverified", "declared", "validated", "tested"]);

export const catalogPluginSummarySchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  description: z.string(),
  packageName: z.string(),
  repositoryUrl: z.url(),
  stars: z.number().int().nonnegative(),
  pushedAt: z.iso.datetime().nullable(),
  featured: z.boolean(),
  categories: z.array(z.string()),
  compatibilityStatus: compatibilityStatusSchema,
  compatibilityLevel: compatibilityLevelSchema,
  installCommand: z.string().nullable(),
});

const catalogMetaContract = oc.output(z.object({
  snapshotId: z.string().nullable(),
  generatedAt: z.iso.datetime().nullable(),
  publishedAt: z.iso.datetime().nullable(),
  pluginCount: z.number().int().nonnegative(),
}));

const catalogListInputSchema = z.object({
  query: z.string().trim().max(100).default(""),
  categories: z.array(z.string()).max(10).default([]),
  compatibility: z.array(compatibilityStatusSchema).max(3).default([]),
  sort: z.enum(["featured", "stars", "updated", "name"]).default("featured"),
  cursor: z.string().max(40).nullable().default(null),
  limit: z.number().int().min(1).max(50).default(24),
  locale: catalogLocaleSchema.optional(),
});

const catalogListContract = oc
  .input(catalogListInputSchema)
  .output(z.object({
    items: z.array(catalogPluginSummarySchema),
    nextCursor: z.string().nullable(),
    total: z.number().int().nonnegative(),
  }));

const catalogDetailContract = oc
  .input(z.object({
    owner: z.string().regex(/^[A-Za-z0-9_.-]+$/),
    repository: z.string().regex(/^[A-Za-z0-9_.-]+$/),
    locale: catalogLocaleSchema.optional(),
  }))
  .output(catalogPluginSchema.nullable());

const catalogCategoriesContract = oc.output(z.array(z.object({
  id: z.string(),
  count: z.number().int().nonnegative(),
})));

const healthContract = oc.output(
  z.object({
    service: z.literal("dshhub-api"),
    status: z.literal("ok"),
    timestamp: z.iso.datetime(),
  }),
);

const helloContract = oc
  .input(
    z.object({
      name: z.string().trim().min(1).max(80),
    }),
  )
  .output(
    z.object({
      message: z.string(),
    }),
  );

export const appContract = {
  catalog: {
    categories: catalogCategoriesContract,
    detail: catalogDetailContract,
    list: catalogListContract,
    meta: catalogMetaContract,
  },
  greeting: {
    hello: helloContract,
  },
  system: {
    health: healthContract,
  },
};

export type AppContract = typeof appContract;
export type CatalogListInput = z.input<typeof catalogListInputSchema>;
export type CatalogPluginSummary = z.infer<typeof catalogPluginSummarySchema>;

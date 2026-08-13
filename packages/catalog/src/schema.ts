import { z } from "zod";

const repositoryNameSchema = z.string().regex(
  /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/,
  "expected owner/repository",
).refine(
  value => value.split("/").every(segment => segment !== "." && segment !== ".."),
  "repository segments cannot be . or ..",
);

const categoryIdSchema = z.string().regex(
  /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  "expected a lowercase kebab-case category",
);

export const registryEntrySchema = z.object({
  schemaVersion: z.literal(1),
  repository: repositoryNameSchema,
  display: z
    .object({
      name: z.string().trim().min(1).max(120).optional(),
      summary: z.string().trim().min(1).max(500).optional(),
    })
    .optional(),
  categories: z.array(categoryIdSchema).min(1),
  documentation: z
    .object({
      install: z.string().trim().min(1).optional(),
      usage: z.string().trim().min(1).optional(),
    })
    .optional(),
  curation: z
    .object({
      featured: z.boolean().default(false),
      hidden: z.boolean().default(false),
    })
    .default({ featured: false, hidden: false }),
});

const compatibilityCheckSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["pass", "warn", "fail", "skip"]),
  summary: z.string().min(1),
});

export const catalogPluginSchema = z.object({
  id: z.string().startsWith("github:"),
  slug: repositoryNameSchema,
  name: z.string().min(1),
  description: z.string(),
  repository: z.object({
    owner: z.string().min(1),
    name: z.string().min(1),
    url: z.url(),
    defaultBranch: z.string().min(1),
    commit: z.string().min(1),
    stars: z.number().int().nonnegative(),
    license: z.string().nullable(),
    topics: z.array(z.string()),
    pushedAt: z.iso.datetime().nullable(),
  }),
  package: z.object({
    name: z.string().min(1),
    version: z.string().nullable(),
    hasBundle: z.boolean(),
    bundlePatch: z.string().nullable(),
    hasPrepareScript: z.boolean(),
    peerDependencies: z.record(z.string(), z.string()),
  }),
  categories: z.array(categoryIdSchema).min(1),
  featured: z.boolean(),
  compatibility: z.object({
    status: z.enum(["compatible", "incompatible", "unknown"]),
    level: z.enum(["unverified", "declared", "validated", "tested"]),
    harnessRange: z.string().nullable(),
    cordisRange: z.string().nullable(),
    checks: z.array(compatibilityCheckSchema),
  }),
  installation: z.object({
    kind: z.enum(["github", "npm", "manual", "unavailable"]),
    spec: z.string().nullable(),
    command: z.string().nullable(),
    markdown: z.string(),
    notes: z.array(z.string()),
  }),
  usage: z.object({
    summary: z.string(),
    markdown: z.string(),
    readmeUrl: z.url(),
  }),
});

export const catalogSnapshotSchema = z.object({
  schemaVersion: z.literal(1),
  snapshotId: z.string().min(1),
  generatedAt: z.iso.datetime(),
  source: z.object({
    repository: z.string().min(1),
    commit: z.string().min(1),
  }),
  mainline: z
    .object({
      ref: z.string().min(1),
      commit: z.string().min(1),
    })
    .nullable(),
  plugins: z.array(catalogPluginSchema),
});

export type RegistryEntry = z.infer<typeof registryEntrySchema>;
export type CatalogPlugin = z.infer<typeof catalogPluginSchema>;
export type CatalogSnapshot = z.infer<typeof catalogSnapshotSchema>;

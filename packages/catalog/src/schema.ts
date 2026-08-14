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

const compatibilityCheckSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["pass", "warn", "fail", "skip"]),
  summary: z.string().min(1),
});

export const catalogLocales = ["zh-CN", "en", "ja", "ko", "zh-TW"] as const;
export const catalogLocaleSchema = z.enum(catalogLocales);

export const catalogI18nEntrySchema = z.object({
  description: z.string().optional(),
  installationMarkdown: z.string().optional(),
  installationNotes: z.array(z.string()).optional(),
  usageMarkdown: z.string().optional(),
  usageSummary: z.string().optional(),
});

export const catalogI18nSchema = z.record(z.string(), catalogI18nEntrySchema);

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
    homepage: z.url().nullable().optional(),
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
  i18n: catalogI18nSchema.optional(),
});

export const catalogSnapshotSchema = z.object({
  schemaVersion: z.literal(1),
  snapshotId: z.string().min(1),
  generatedAt: z.iso.datetime(),
  changedRepositories: z.array(repositoryNameSchema).optional(),
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

export type CatalogPlugin = z.infer<typeof catalogPluginSchema>;
export type CatalogSnapshot = z.infer<typeof catalogSnapshotSchema>;
export type CatalogLocale = z.infer<typeof catalogLocaleSchema>;
export type CatalogI18nEntry = z.infer<typeof catalogI18nEntrySchema>;

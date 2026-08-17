# Catalog pipeline

DSH Hub discovers plugins directly from GitHub topics. No reviewed registry or repository allowlist participates in publication.

## Data flow

```text
GitHub topic search
  -> repository tree + raw default-branch files
  -> installable package qualification
  -> automatic category inference
  -> .catalog/catalog.snapshot.json
     -> README catalog section
     -> changed-repository projection
     -> size-bounded POST /internal/catalog-imports batches
        -> R2 immutable import batches
        -> Queue message
        -> D1 repository-scoped incremental import
        -> Web oRPC queries
```

The first D1 import writes a complete run and switches it to `current`. Later imports send only repositories listed in `changedRepositories`; repositories outside that list stay in D1 and are not retransmitted. The publisher uses compact JSON and splits large changes into requests below the API byte limit. A repository whose projection cannot fit in one request is isolated so its prior D1 projection remains current while other repositories publish. D1 applies every batch to a staging run, verifies that all preceding parts completed, switches `current` only after the final batch succeeds, and removes archived searchable projections after the switch. R2 retains the import history.

## Discovery and qualification

Web requests pass the current UI locale into `catalog.list` and `catalog.detail`. Catalog content is published in the language used by each repository. The API still accepts older snapshots containing `plugin.i18n`, and falls back to the original scraped text whenever a locale-specific entry is absent.

The hourly discovery build reads the current snapshot from Cloudflare, searches repositories seen since that snapshot, skips repositories already present in the catalog, and deduplicates these topics:

- `dsh-plugin`
- `deepseek-harness-plugin`
- `deepseek-harness-plugins`

New repositories are validated and appended to the catalog. A weekly refresh job reloads repositories already in the catalog and marks a repository as changed only when its stored plugin projection differs; a temporary repository failure keeps its prior data. The first run or a previous snapshot below the minimum count performs full discovery. Discovery fails instead of publishing when GitHub reports incomplete search results.

For each non-archived, non-fork repository, the collector reads the default-branch tree and checks:

- root `package.json`;
- `packages/*/package.json`;
- `plugins/*/package.json`.

A package is included when it declares `name` and at least one of `main`, `exports`, or `dsh`. The collector records the exact default-branch commit, checks the declared bundle path, reads Harness or Cordis peer ranges, and extracts installation and usage sections from the nearest README. Workspace packages use their own directory README when that file exists, even if it is short, and only fall back to the repository root README when the package has no README. The plugin description uses `package.json`, then the GitHub repository description, then the first README paragraph. Categories are inferred from repository topics, package keywords, names, and descriptions. The detail page also fetches the live README (preferring locale-specific files such as `README.zh-CN.md`) so the stored excerpt is not the only documentation shown.

Malformed packages, empty repositories, and unavailable repositories are logged and skipped. `CATALOG_MIN_PLUGIN_COUNT` prevents a degraded discovery run from replacing the current catalog; CI uses a minimum of 50.

## GitHub Actions configuration

The `Publish plugin catalog` workflow runs discovery every hour, refreshes existing repositories every Sunday, and supports either mode through manual dispatch. Configure these repository secrets:

| Secret | Purpose |
| --- | --- |
| `CATALOG_API_URL` | Public HTTPS origin of `dshhub-api`, without `/internal/catalog-imports` |
| `CATALOG_INGEST_TOKEN` | Shared ingest token configured on the API Worker |

Set the same token on Cloudflare:

```bash
pnpm --filter @dshhub/api exec wrangler secret put CATALOG_INGEST_TOKEN
```

Before the first publish, apply remote D1 migrations and deploy the API Worker:

```bash
pnpm --filter @dshhub/api run db:migrate:remote
pnpm deploy:api
```

## Local checks

Build the snapshot and generated README section:

```bash
GITHUB_TOKEN=... pnpm catalog:build
```

Refresh every repository already present in the current snapshot:

```bash
GITHUB_TOKEN=... \
CATALOG_API_URL=... \
CATALOG_INGEST_TOKEN=... \
pnpm catalog:refresh
```

Apply D1 migrations before publishing catalog data:

```bash
pnpm --filter @dshhub/api run db:migrate:local
```

Publish to a local or deployed API:

```bash
CATALOG_API_URL=http://localhost:8787 \
CATALOG_INGEST_TOKEN=... \
pnpm catalog:publish
```

`.catalog/` is ignored because it contains the generated catalog artifact. R2 keeps the durable import batches; D1 holds the searchable projection and preserves repositories omitted from incremental requests.

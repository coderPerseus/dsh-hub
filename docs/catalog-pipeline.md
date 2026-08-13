# Catalog pipeline

DSH Hub discovers plugins directly from GitHub topics. No reviewed registry or repository allowlist participates in publication.

## Data flow

```text
GitHub topic search
  -> repository tree + Contents API
  -> installable package qualification
  -> automatic category inference
  -> .catalog/catalog.snapshot.json
     -> README catalog section
     -> POST /internal/catalog-imports
        -> R2 immutable snapshot
        -> Queue message
        -> D1 run-scoped import
        -> current catalog switch
        -> Web oRPC queries
```

The D1 importer writes a complete run under a new `run_id`. Only after every plugin, category, and search row has been written does it change that run to `current`. The previous run becomes `archived`, so readers never see a partially imported catalog.

## Discovery and qualification

The scheduled build searches these topics and deduplicates repositories:

- `dsh-plugin`
- `deepseek-harness-plugin`
- `deepseek-harness-plugins`

For each non-archived, non-fork repository, the collector reads the default-branch tree and checks:

- root `package.json`;
- `packages/*/package.json`;
- `plugins/*/package.json`.

A package is included when it declares `name` and at least one of `main`, `exports`, or `dsh`. The collector records the exact default-branch commit, checks the declared bundle path, reads Harness or Cordis peer ranges, and extracts installation and usage sections from the nearest README. Categories are inferred from repository topics, package keywords, names, and descriptions.

Malformed packages, empty repositories, and unavailable repositories are logged and skipped. `CATALOG_MIN_PLUGIN_COUNT` prevents a degraded discovery run from replacing the current catalog; CI uses a minimum of 50.

## GitHub Actions configuration

The `Publish plugin catalog` workflow runs after collector changes, every eight hours, and on manual dispatch. Configure these repository secrets:

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

Publish to a local or deployed API:

```bash
CATALOG_API_URL=http://localhost:8787 \
CATALOG_INGEST_TOKEN=... \
pnpm catalog:publish
```

`.catalog/` is ignored because it contains the generated transport artifact. R2 keeps the durable raw snapshot; D1 holds the searchable projection.

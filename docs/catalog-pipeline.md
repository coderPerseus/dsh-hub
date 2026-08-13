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
     -> POST /internal/catalog-imports
        -> R2 immutable snapshot
        -> Queue message
        -> D1 repository-scoped incremental import
        -> Web oRPC queries
```

The first D1 import writes a complete run and switches it to `current`. Later imports update only repositories listed in `changedRepositories`. Repositories outside that list keep their existing rows.

## Discovery and qualification

Web requests pass the current UI locale into `catalog.list` and `catalog.detail`. The API overlays `plugin.i18n[locale]` onto description, usage, and installation copy, then falls back to the original scraped text.

The hourly discovery build reads the current snapshot from Cloudflare, searches repositories seen since that snapshot, skips repositories already present in the catalog, and deduplicates these topics:

- `dsh-plugin`
- `deepseek-harness-plugin`
- `deepseek-harness-plugins`

New repositories are validated and appended to the catalog. A weekly refresh job reloads repositories already in the catalog and replaces only the packages belonging to repositories that refreshed successfully; a temporary repository failure keeps its prior data. The first run or a previous snapshot below the minimum count performs full discovery. Discovery fails instead of publishing when GitHub reports incomplete search results.

For each non-archived, non-fork repository, the collector reads the default-branch tree and checks:

- root `package.json`;
- `packages/*/package.json`;
- `plugins/*/package.json`.

A package is included when it declares `name` and at least one of `main`, `exports`, or `dsh`. The collector records the exact default-branch commit, checks the declared bundle path, reads Harness or Cordis peer ranges, and extracts installation and usage sections from the nearest README. Categories are inferred from repository topics, package keywords, names, and descriptions.

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

Translate scraped plugin copy into `zh-CN`, `en`, `ja`, `ko`, and `zh-TW` after a local snapshot exists. The script caches results in `.catalog/i18n-cache.json` and writes translations back onto the snapshot:

```bash
NEW_API_URL=https://api.example.com/v1/chat/completions NEW_API_KEY=... pnpm catalog:translate
NEW_API_URL=https://api.example.com/v1/chat/completions NEW_API_KEY=... pnpm catalog:translate -- --limit 5
```

Required environment:

- `NEW_API_URL` — OpenAI-compatible chat completions endpoint
- `NEW_API_KEY` — API key for that endpoint

Optional environment:

- `NEW_API_MODEL` — default `deepseek-v4-flash`

The publish workflow runs this translation step after catalog discovery. Configure
`NEW_API_URL` and `NEW_API_KEY` as GitHub Actions repository secrets before running it.
It restores the translation cache between runs and chunks long Markdown fields before
translation. A translated snapshot is published as a full import so translations for
unchanged repositories also reach the API.

Then apply D1 migrations and publish so the API can serve locale-specific descriptions:

```bash
pnpm --filter @dshhub/api run db:migrate:local
```

Publish to a local or deployed API:

```bash
CATALOG_API_URL=http://localhost:8787 \
CATALOG_INGEST_TOKEN=... \
pnpm catalog:publish
```

`.catalog/` is ignored because it contains the generated transport artifact. R2 keeps the durable raw snapshot; D1 holds the searchable projection.

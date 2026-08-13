# Catalog pipeline

DSH Hub uses a curated registry as the source of truth. CI reads the registered repository list and calls GitHub's repository and Contents APIs for each entry. It does not clone repositories, enumerate an organization, or publish topic-search results without review.

## Data flow

```text
registry/*.yaml
  -> GitHub repository + Contents API
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

## Register a plugin

Create `registry/<owner>__<repository>.yaml`:

```yaml
schemaVersion: 1
repository: owner/repository
categories:
  - development
curation:
  featured: false
  hidden: false
```

Optional overrides:

```yaml
display:
  name: Display name
  summary: Short description shown in the catalog
documentation:
  install: Maintainer installation note
  usage: Maintainer usage note
```

The current builder validates that the repository has an installable `package.json`, records the default-branch commit, checks the declared bundle path, reads Harness or Cordis peer ranges, and extracts installation and usage sections from the README.

## GitHub Actions configuration

The `Publish plugin catalog` workflow runs after registry or builder changes, every eight hours, and on manual dispatch. Configure these repository secrets:

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

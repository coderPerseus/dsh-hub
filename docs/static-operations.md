# Static catalog operations

DSH Hub now serves pre-rendered HTML and versioned JSON assets. No Worker application code, D1 binding, queue, or R2 binding is required for public traffic. The frontend retains the original cards, search filters, detail pages, multilingual UI, and install commands. Search runs in the browser; descriptions and README content remain repository-authored.

## Data and recovery

The legacy `dshhub-api` Worker has been deleted and the `dshhub-catalog-imports` consumer removed. The public Worker has no application bindings.

The initial migration preserved 13,617 plugins and 46 submissions. The verified private SQL backup (including submissions) and catalog JSON are in `/Users/luckysnail/Documents/dshhub-backup-2026-09-12/`. Do not upload the SQL backup or submissions to public Releases. D1 FTS tables can be rebuilt from the canonical plugin records and are excluded from the SQL export.

Public catalog snapshots are compressed GitHub Release assets. `catalog-current/catalog.snapshot.json.gz` is the last successfully published snapshot. Each successful workflow also creates an immutable `catalog-RUN_ID-ATTEMPT` backup. If discovery, validation, or deployment fails, the published site and the successful cursor remain unchanged. Restore refuses to silently start with empty data. Drops greater than 10% and builds exceeding 19,500 files or 24 MiB per asset fail closed. If a save fails after deployment, a later run may repeat discovery from the older successful snapshot; records merge by repository identity.

## Deployment

`pnpm --filter @dshhub/web exec tsx ../../scripts/restore-catalog.mts`

`pnpm deploy:web`

The daily GitHub workflow discovers plugins at 03:17 UTC; Each daily run also refreshes 300 existing repositories using a persisted cursor (about 42 days per full pass at the migration size). Discovery and refresh cursors are separate so refresh never skips new repositories. A failed discovery preserves its successful cursor. Manual mode `publish` redeploys the last successful snapshot without crawling. `backfill` accepts an explicit ISO timestamp; `repository` targets one repository. Submitters open the GitHub Issue form; a maintainer validates the repository and runs the manual workflow. Existing database submissions remain in the private backup and must be reviewed separately.

CI needs `CLOUDFLARE_API_TOKEN` for this account with Workers Scripts Edit and Account Settings Read. It deploys the existing worker with `wrangler.ci.jsonc`, leaving domain management to the first local deployment. Do not restore the legacy D1 binding or re-enable the old importer. Root `deploy` only deploys static assets. `OPEN_NEXT_DEPLOY=true` bypasses Wrangler's automatic OpenNext delegation; the retained Next sources and dependencies are legacy references, not the production entrypoint.

## Clients

Version 0.2.0 of the client, CLI and native plugin uses `/catalog/manifest.json`, an index and one detail shard. The typed client caches the index for five minutes. Explicit custom API URLs retain the legacy transport; `transport: 'static'` selects a static mirror. The old dynamic `/api/v1/plugins` search endpoint is retired and must not return an unfiltered list as if it had searched successfully.

## Cost boundary

Static Assets requests and asset storage have no usage fees under the current Cloudflare pricing. Do not add a Worker `main`, `run_worker_first`, SSR, database reads, image transformations or dynamic proxy as a convenience. A build with only assets is the budget boundary. Account subscriptions, other projects, domain renewal and any residual storage must be accounted for separately. The old D1 is approximately 485 MB and R2 605 MB; preserve them as offline recovery resources until retention is reviewed, with no app bindings, scheduled writes, or queue consumption. They consume shared storage allowances.

## Acceptance

Check desktop/mobile search (including Chinese), multiple categories, sorting, pagination/back navigation, language switching, detail README links, copy buttons, missing pages, sitemap, CLI search and plugin detail. Verify the deployed service has assets only and no application bindings. Never interpret a passing build or queued CI as a completed release.

# Static catalog operations

DSH Hub now serves pre-rendered HTML and versioned JSON assets. No Worker application code, D1 binding, queue, or R2 binding is required for public traffic. The frontend retains the original cards, search filters, detail pages, multilingual UI, and install commands. Search runs in the browser; original descriptions and README content remain repository-authored. Chinese descriptions and the AI Analysis section are generated offline from that official source material.

## Data and recovery

The legacy `dshhub-api` Worker has been deleted and the `dshhub-catalog-imports` consumer removed. The public Worker has no application bindings.

The initial migration preserved 13,617 plugins and 46 submissions. The verified private SQL backup (including submissions) and catalog JSON are in `/Users/luckysnail/Documents/dshhub-backup-2026-09-12/`. Do not upload the SQL backup or submissions to public Releases. D1 FTS tables can be rebuilt from the canonical plugin records and are excluded from the SQL export.

Public catalog snapshots are compressed GitHub Release assets. `catalog-current/catalog.snapshot.json.gz` is the last successfully published snapshot. Each successful workflow also creates an immutable `catalog-RUN_ID-ATTEMPT` backup. If discovery, validation, or deployment fails, the published site and the successful cursor remain unchanged. Restore refuses to silently start with empty data. Drops greater than 10% and builds exceeding 19,500 files or 24 MiB per asset fail closed. If a save fails after deployment, a later run may repeat discovery from the older successful snapshot; records merge by repository identity.

## Deployment

`pnpm --filter @dshhub/web exec tsx ../../scripts/restore-catalog.mts`

`data/catalog-enrichment.json` stores pinned Chinese plugin copy and AI-analysis sidecar entries keyed by plugin id and source hash. The build step now applies this file after translating snapshot fields are stripped so stable catalog snapshots keep curated Chinese descriptions and analysis.

`pnpm --filter @dshhub/web exec tsx ../../scripts/enrich-catalog.mts`
Rerun this command to resume generation from the current partial cache after any interruption. It defaults to three concurrent GPT-5.3-Codex-Spark processes, with 40 plugins per batch. Generated Chinese descriptions and analysis are each limited to 100 Unicode characters. Logs and failure reports live in `.catalog/`. Account usage limits stop further dispatch; successfully saved entries remain reusable. To explicitly select another model, set `CATALOG_ENRICH_MODEL`. For the Midway Gemini endpoint, set `CATALOG_ENRICH_PROVIDER=midway`, `CATALOG_ENRICH_MODEL=gemini-3.5-flash`, and `MIDWAY_API_KEY` (or `MIDWAY_API_KEY_FILE` pointing to a private file outside the repository). The key is never included in output logs. Model listings do not guarantee an active upstream channel; smoke-test before a full run.

Before publishing a full enrichment pass, run `pnpm --filter @dshhub/web exec tsx ../../scripts/check-catalog-enrichment.mts` to verify every current plugin has matching Chinese copy and analysis. Source changes invalidate the matching sidecar entry; rerun enrichment after refreshing official metadata.

`pnpm deploy:web`

The daily GitHub workflow discovers plugins at 03:17 UTC; it splits the interval since the last successful discovery into hourly push-time windows to avoid silently truncating large search results at 1,000 repositories; Each daily run also refreshes up to 300 existing repositories using a persisted cursor (at least 42 days per full pass at the migration size). The batch shrinks according to remaining GitHub REST quota, reserving 100 calls for publishing; zero capacity preserves the refresh cursor. Workflow run names distinguish site-only publishing from actual discovery/backfill. Discovery and refresh cursors are separate so refresh never skips new repositories. A failed discovery preserves its successful cursor. Manual mode `publish` redeploys the last successful snapshot without crawling. `backfill` accepts an explicit ISO timestamp; `repository` targets one repository. Submitters open the GitHub Issue form; a maintainer validates the repository and runs the manual workflow. Existing database submissions remain in the private backup and must be reviewed separately.

CI needs `CLOUDFLARE_API_TOKEN` for this account with Workers Scripts Edit and Account Settings Read. It deploys the existing worker with `wrangler.ci.jsonc`, leaving domain management to the first local deployment. Do not restore the legacy D1 binding or re-enable the old importer. Root `deploy` only deploys static assets. `OPEN_NEXT_DEPLOY=true` bypasses Wrangler's automatic OpenNext delegation; the retained Next sources and dependencies are legacy references, not the production entrypoint.

## Clients

The 0.2.0 source migration is complete and the CLI has been checked against production; publishing these packages to npm is pending maintainer npm login. Run the CLI from this checkout until that release is available.

Version 0.2.0 of the client, CLI and native plugin uses `/catalog/manifest.json`, an index and one detail shard. The typed client caches the index for five minutes. Explicit custom API URLs retain the legacy transport; `transport: 'static'` selects a static mirror. The old dynamic `/api/v1/plugins` search endpoint is retired and must not return an unfiltered list as if it had searched successfully.

## Cost boundary

Static Assets requests and asset storage have no usage fees under the current Cloudflare pricing. Do not add a Worker `main`, `run_worker_first`, SSR, database reads, image transformations or dynamic proxy as a convenience. A build with only assets is the budget boundary. Account subscriptions, other projects, domain renewal and any residual storage must be accounted for separately. The old D1 is approximately 485 MB and R2 605 MB; preserve them as offline recovery resources until retention is reviewed, with no app bindings, scheduled writes, or queue consumption. They consume shared storage allowances.

## Acceptance

Check desktop/mobile search (including Chinese), multiple categories, sorting, pagination/back navigation, language switching, detail README links, copy buttons, missing pages, sitemap, CLI search and plugin detail. Verify the deployed service has assets only and no application bindings. Never interpret a passing build or queued CI as a completed release.

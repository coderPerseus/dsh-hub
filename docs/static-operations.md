# Static catalog operations

DSH Hub now serves pre-rendered HTML and versioned JSON assets. No Worker application code, D1 binding, queue, or R2 binding is required for public traffic. The frontend retains the original cards, search filters, detail pages, multilingual UI, and install commands. Search runs in the browser; original descriptions and README content remain repository-authored. Chinese descriptions and the AI Analysis section are generated offline from that official source material.

## Data and recovery

The legacy `dshhub-api` Worker has been deleted and the `dshhub-catalog-imports` consumer removed. The public Worker has no application bindings.

The initial migration preserved 13,617 plugins and 46 submissions. The verified private SQL backup (including submissions) and catalog JSON are in `/Users/luckysnail/Documents/dshhub-backup-2026-09-12/`. Do not upload the SQL backup or submissions to public Releases. D1 FTS tables can be rebuilt from the canonical plugin records and are excluded from the SQL export.

Public catalog snapshots are compressed GitHub Release assets. `catalog-current/catalog.snapshot.json.gz` is the last successfully published snapshot. Each successful workflow also creates an immutable `catalog-RUN_ID-ATTEMPT` backup. If discovery or validation fails, the published site and successful cursor remain unchanged. A deployment failure can leave some locales updated; the durable cursor advances only after the whole rollout succeeds. Restore refuses to silently start with empty data. Drops greater than 10% and any individual deployment exceeding 19,500 files or 24 MiB per asset fail closed. If a save fails after deployment, a later run may repeat discovery from the older successful snapshot; records merge by repository identity.

## Deployment

`pnpm --filter @dshhub/web exec tsx ../../scripts/restore-catalog.mts`

`data/catalog-enrichment.json` stores pinned Chinese plugin copy and AI-analysis sidecar entries keyed by plugin id and source hash. The build step now applies this file after translating snapshot fields are stripped so stable catalog snapshots keep curated Chinese descriptions and analysis.

`pnpm --filter @dshhub/web exec tsx ../../scripts/enrich-catalog.mts`
Rerun this command to resume generation from the current partial cache after any interruption. It defaults to three concurrent GPT-5.3-Codex-Spark processes, with 40 plugins per batch. Generated Chinese descriptions and analysis are each limited to 100 Unicode characters. Logs and failure reports live in `.catalog/`. Account usage limits stop further dispatch; successfully saved entries remain reusable. To explicitly select another model, set `CATALOG_ENRICH_MODEL`. For the Midway Gemini endpoint, set `CATALOG_ENRICH_PROVIDER=midway`, `CATALOG_ENRICH_MODEL=gemini-3.5-flash`, and `MIDWAY_API_KEY` (or `MIDWAY_API_KEY_FILE` pointing to a private file outside the repository). The key is never included in output logs. Model listings do not guarantee an active upstream channel; smoke-test before a full run.

Before publishing a full enrichment pass, run `pnpm --filter @dshhub/web exec tsx ../../scripts/check-catalog-enrichment.mts` to verify every current plugin has matching Chinese copy and analysis. Source changes invalidate the matching sidecar entry; rerun enrichment after refreshing official metadata.

`pnpm deploy:web`

The daily GitHub workflow discovers plugins at 03:17 UTC; it splits the interval since the last successful discovery into hourly push-time windows to avoid silently truncating large search results at 1,000 repositories; Each daily run also refreshes up to 300 existing repositories using a persisted cursor (at least 42 days per full pass at the migration size). The batch shrinks according to remaining GitHub REST quota, reserving 100 calls for publishing; zero capacity preserves the refresh cursor. Workflow run names distinguish site-only publishing from actual discovery/backfill. Discovery and refresh cursors are separate so refresh never skips new repositories. A failed discovery preserves its successful cursor. Manual mode `publish` redeploys the last successful snapshot without crawling. `backfill` accepts an explicit ISO timestamp; `repository` targets one repository. Submitters open the GitHub Issue form; a maintainer validates the repository and runs the manual workflow. Existing database submissions remain in the private backup and must be reviewed separately.

### Correct one existing listing

Use the manual **Publish plugin catalog** workflow with `mode=discover` and
`repository=owner/repo`. An explicit repository is fetched directly from its
current default branch even if it is already in the catalog. Other repositories,
the discovery timestamp, the refresh cursor, and unrelated retry entries are
preserved. Omitting `repository` retains normal discovery/rotating-refresh behavior.
For a local preview, restore the durable snapshot first, then run:

```bash
CATALOG_REPOSITORY=guannan1031/dsh-commerce-cockpit pnpm catalog:build
```

Provide `GITHUB_TOKEN` through your environment when needed. Review the refreshed
package description and README, then update that plugin's source-hashed entry in
`data/catalog-enrichment.json` before publishing so Chinese text matches the new
capability boundaries. Both root READMEs receive generated catalog sections;
English remains the default and `README.zh-CN.md` uses Chinese descriptions when
available. Data-analysis, ecommerce, and CSV tools use the existing `productivity`
category; there is no separate Tools/Data category.

CI needs `CLOUDFLARE_API_TOKEN` for this account with Workers Scripts Edit and Account Settings Read. It deploys the existing worker with `wrangler.ci.jsonc`, leaving domain management to the first local deployment. Do not restore the legacy D1 binding or re-enable the old importer. Root `deploy` only deploys static assets. `OPEN_NEXT_DEPLOY=true` bypasses Wrangler's automatic OpenNext delegation; the retained Next sources and dependencies are legacy references, not the production entrypoint.

## Clients

The 0.2.0 source migration is complete and the CLI has been checked against production; publishing these packages to npm is pending maintainer npm login. Run the CLI from this checkout until that release is available.

Version 0.2.0 of the client, CLI and native plugin uses `/catalog/manifest.json`, an index and one detail shard. The typed client caches the index for five minutes. Explicit custom API URLs retain the legacy transport; `transport: 'static'` selects a static mirror. The old dynamic `/api/v1/plugins` search endpoint is retired and must not return an unfiltered list as if it had searched successfully.

## Cost boundary

Static Assets requests and asset storage have no usage fees under the current Cloudflare pricing. Do not add a Worker `main`, `run_worker_first`, SSR, database reads, image transformations or dynamic proxy as a convenience. A build with only assets is the budget boundary. Account subscriptions, other projects, domain renewal and any residual storage must be accounted for separately. The old D1 is approximately 485 MB and R2 605 MB; preserve them as offline recovery resources until retention is reviewed, with no app bindings, scheduled writes, or queue consumption. They consume shared storage allowances.

## Acceptance

Check desktop/mobile search (including Chinese), multiple categories, sorting, pagination/back navigation, language switching, detail README links, copy buttons, missing pages, sitemap, CLI search and plugin detail. Verify the deployed service has assets only and no application bindings. Never interpret a passing build or queued CI as a completed release.

## Language paths and search indexing

Public pages use `/zh-CN/`, `/en/`, `/ja/`, `/ko/`, and `/zh-TW/`. The URL is authoritative: stored preferences and browser detection never override it. Language links preserve the page, search/filter/cursor parameters, and fragment. Unprefixed `/` and `/plugins/*` permanently redirect to Chinese paths. Page URLs use trailing slashes consistently.

Each locale has pre-rendered HTML, its own canonical URL and title/description, reciprocal `hreflang` links (Chinese is `x-default`), localized structured-data URLs, and a sitemap. `/sitemap.xml` is a sitemap index pointing to five locale sitemaps. Missing pages return 404 and carry `noindex`; search/filter variants canonicalize to their locale homepage. Crawlers receive the selected UI language without JavaScript. This change does not translate repository README files or add missing catalog translations: original official text remains the fallback, and Chinese AI analysis is marked with its actual content language.

The deployment is split into the shared `dshhub-web` (catalog JSON, fonts, icons, robots, sitemap index and old-URL redirects) and five assets-only Workers named `dshhub-web-zh-cn`, `dshhub-web-en`, `dshhub-web-ja`, `dshhub-web-ko`, `dshhub-web-zh-tw`. Each locale owns exactly `dshhub.org/LOCALE` and `dshhub.org/LOCALE/*` routes in front of the existing root Custom Domain. There is no router script, SSR, service binding or runtime database access. Every deployment retains the 19,500-file and 24-MiB-per-file guards. Each locale includes its own fingerprinted JS/CSS to avoid bundle mismatches during a rollout.

`pnpm --filter @dshhub/web build` creates shared assets in `apps/web/dist` and locale assets/configs in ignored `apps/web/.static-build`. Then `pnpm --filter @dshhub/web exec tsx ../../scripts/check-static-locales.mts` verifies all generated page language/canonical/alternate tags, sitemap counts, sample structured data, and 404 behavior.

`pnpm deploy:web` builds and deploys locale Workers with at most two concurrent uploads, followed by the shared root Worker. The initial local deployment configures path routes using the existing Wrangler OAuth login (Zone Read and Workers Routes Write). CI runs `scripts/deploy-static-locales.mts --ci`, retaining these preconfigured routes without needing additional token permissions. A deployment failure stops subsequent deployments; an already-updated locale can remain live, so retry the same revision to complete the rollout. The shared root is updated last; this is a staged rollout, not an atomic switch across all six Workers. For rollback, rebuild and redeploy the last successful localized revision across all six Workers; do not deploy a pre-localization revision without also removing or reverting locale routes.

For local inspection after building, `pnpm --filter @dshhub/web preview` serves all locale directories and shared assets together at `http://127.0.0.1:3000/zh-CN/`, so language switching, search and shared fonts work on one origin. This is a local-only static file server; Cloudflare production remains assets-only.


### Repository failures during catalog updates

A repository fetch or plugin build failure is isolated to that repository. Its previous
plugins remain in the snapshot, while healthy repositories are published normally.
The snapshot persists `pendingRepositories`; discovery retries up to 100 queued repositories
per run independently of the search timestamp, rotating unresolved entries to the back.
Successful retries leave the queue. Scheduled refresh also preserves this queue.
Authentication failures, exhausted rate-limit/server retries, incomplete search results,
and catalog size guards still fail the run instead of publishing an incomplete scan.


### Daily Chinese descriptions and AI analysis

The local Codex heartbeat `dsh-hub-ai` runs daily at 18:00 Asia/Shanghai after catalog
sync. It waits for any catalog publishing run, restores the latest durable snapshot,
and uses `pnpm catalog:enrich:auto`. This command starts three concurrent
`gpt-5.3-codex-spark` jobs and reuses valid source-hash cache entries. If Spark quota
is exhausted or the model is unavailable, it resumes remaining entries through
Midway `gemini-3.5-flash`. Invalid output is rejected rather than silently accepted.
Both fields must contain Chinese and stay within 100 Unicode characters.

The fallback key is read from `MIDWAY_API_KEY_FILE`, defaulting to the owner's
`~/.config/dshhub/midway-api-key` (owner-only permissions), or `MIDWAY_API_KEY`.
Never commit or log the key. The local heartbeat needs the owner's Mac/Codex environment
and existing Codex/GitHub login to run; it is separate from the GitHub catalog discovery
schedule. No-change runs make no commit or deployment. Changed data is validated,
published through the normal PR/CI flow, and checked against live catalog detail shards.
The automatic generator locks `.catalog/enrichment-auto.lock`; if interrupted, verify
that its recorded PID is no longer running before removing a stale lock.

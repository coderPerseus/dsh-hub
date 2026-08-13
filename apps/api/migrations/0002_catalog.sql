CREATE TABLE catalog_runs (
  id TEXT PRIMARY KEY,
  snapshot_id TEXT NOT NULL UNIQUE,
  schema_version INTEGER NOT NULL,
  source_repository TEXT NOT NULL,
  source_commit TEXT NOT NULL,
  mainline_commit TEXT,
  r2_key TEXT NOT NULL,
  sha256 TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL CHECK (status IN ('queued', 'importing', 'current', 'archived', 'failed')),
  plugin_count INTEGER NOT NULL DEFAULT 0,
  generated_at TEXT NOT NULL,
  published_at TEXT,
  error TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX catalog_runs_status_idx ON catalog_runs(status, published_at DESC);

CREATE TABLE plugin_snapshots (
  run_id TEXT NOT NULL REFERENCES catalog_runs(id) ON DELETE CASCADE,
  plugin_id TEXT NOT NULL,
  slug TEXT NOT NULL,
  owner TEXT NOT NULL,
  repo TEXT NOT NULL,
  name TEXT NOT NULL,
  package_name TEXT NOT NULL,
  description TEXT NOT NULL,
  compatibility_status TEXT NOT NULL,
  compatibility_level TEXT NOT NULL,
  stars INTEGER NOT NULL,
  pushed_at TEXT,
  repository_url TEXT NOT NULL,
  featured INTEGER NOT NULL DEFAULT 0,
  installation_json TEXT NOT NULL,
  compatibility_json TEXT NOT NULL,
  usage_summary TEXT NOT NULL,
  usage_markdown TEXT NOT NULL,
  raw_json TEXT NOT NULL,
  PRIMARY KEY (run_id, plugin_id)
);

CREATE INDEX plugin_snapshots_run_sort_idx
  ON plugin_snapshots(run_id, featured DESC, stars DESC, name);
CREATE INDEX plugin_snapshots_run_slug_idx ON plugin_snapshots(run_id, slug);

CREATE TABLE plugin_categories (
  run_id TEXT NOT NULL,
  plugin_id TEXT NOT NULL,
  category_id TEXT NOT NULL,
  PRIMARY KEY (run_id, plugin_id, category_id),
  FOREIGN KEY (run_id, plugin_id)
    REFERENCES plugin_snapshots(run_id, plugin_id)
    ON DELETE CASCADE
);

CREATE INDEX plugin_categories_filter_idx
  ON plugin_categories(run_id, category_id, plugin_id);

CREATE VIRTUAL TABLE plugin_search USING fts5(
  run_id UNINDEXED,
  plugin_id UNINDEXED,
  name,
  package_name,
  description,
  topics,
  usage,
  tokenize = 'unicode61'
);

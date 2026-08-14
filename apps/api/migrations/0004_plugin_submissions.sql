CREATE TABLE plugin_submissions (
  id TEXT PRIMARY KEY,
  repository_key TEXT NOT NULL UNIQUE,
  repository_owner TEXT NOT NULL,
  repository_name TEXT NOT NULL,
  repository_url TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'published', 'rejected')),
  submit_count INTEGER NOT NULL DEFAULT 1,
  first_submitted_at TEXT NOT NULL,
  last_submitted_at TEXT NOT NULL,
  processed_at TEXT,
  note TEXT
);

CREATE INDEX plugin_submissions_status_idx
  ON plugin_submissions(status, last_submitted_at DESC);

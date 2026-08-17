ALTER TABLE catalog_runs ADD COLUMN batch_id TEXT;
ALTER TABLE catalog_runs ADD COLUMN batch_index INTEGER;
ALTER TABLE catalog_runs ADD COLUMN batch_total INTEGER;
ALTER TABLE catalog_runs ADD COLUMN batch_advances_cursor INTEGER;

CREATE UNIQUE INDEX catalog_runs_batch_idx ON catalog_runs(batch_id, batch_index);

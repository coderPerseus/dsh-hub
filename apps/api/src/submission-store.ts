export type NormalizedRepository = {
  name: string;
  owner: string;
  url: string;
};

export type SubmissionResult = {
  repositoryUrl: string;
  status: "accepted" | "duplicate" | "already_indexed";
};

export class SubmissionStore {
  constructor(private readonly db: D1Database) {}

  async create(repository: NormalizedRepository): Promise<SubmissionResult> {
    const repositoryKey = `${repository.owner}/${repository.name}`.toLowerCase();
    const indexed = await this.db.prepare(
      `SELECT 1 AS found
       FROM plugin_snapshots
       WHERE run_id = (
         SELECT id FROM catalog_runs WHERE status = 'current' ORDER BY published_at DESC LIMIT 1
       ) AND lower(owner) = ? AND lower(repo) = ?
       LIMIT 1`,
    ).bind(repository.owner.toLowerCase(), repository.name.toLowerCase()).first();
    if (indexed !== null) {
      return { repositoryUrl: repository.url, status: "already_indexed" };
    }

    const existing = await this.db.prepare(
      "SELECT id FROM plugin_submissions WHERE repository_key = ?",
    ).bind(repositoryKey).first<{ id: string }>();
    const now = new Date().toISOString();
    await this.db.prepare(
      `INSERT INTO plugin_submissions (
         id, repository_key, repository_owner, repository_name, repository_url,
         status, submit_count, first_submitted_at, last_submitted_at
       ) VALUES (?, ?, ?, ?, ?, 'pending', 1, ?, ?)
       ON CONFLICT(repository_key) DO UPDATE SET
         repository_owner = excluded.repository_owner,
         repository_name = excluded.repository_name,
         repository_url = excluded.repository_url,
         status = CASE WHEN plugin_submissions.status = 'rejected' THEN 'pending' ELSE plugin_submissions.status END,
         submit_count = MIN(plugin_submissions.submit_count + 1, 1000000),
         last_submitted_at = excluded.last_submitted_at`,
    ).bind(
      existing?.id ?? crypto.randomUUID(),
      repositoryKey,
      repository.owner,
      repository.name,
      repository.url,
      now,
      now,
    ).run();

    return {
      repositoryUrl: repository.url,
      status: existing === null ? "accepted" : "duplicate",
    };
  }
}

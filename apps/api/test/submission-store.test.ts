import { describe, expect, it, vi } from "vitest";

import { normalizeGitHubRepositoryUrl } from "@dshhub/contracts";
import { SubmissionStore } from "../src/submission-store";

describe("GitHub repository submissions", () => {
  it("normalizes supported repository URLs", () => {
    expect(normalizeGitHubRepositoryUrl("https://github.com/Owner/repo.git/")).toEqual({
      name: "repo",
      owner: "Owner",
      url: "https://github.com/Owner/repo",
    });
    expect(normalizeGitHubRepositoryUrl("https://github.com/owner/repo/issues")).toBeNull();
    expect(normalizeGitHubRepositoryUrl("https://example.com/owner/repo")).toBeNull();
  });

  it("returns already indexed without creating a queue record", async () => {
    const run = vi.fn();
    const db = {
      prepare: vi.fn(() => ({
        bind: () => ({ first: async () => ({ found: 1 }), run }),
      })),
    } as unknown as D1Database;

    await expect(new SubmissionStore(db).create({
      name: "repo",
      owner: "owner",
      url: "https://github.com/owner/repo",
    })).resolves.toEqual({
      repositoryUrl: "https://github.com/owner/repo",
      status: "already_indexed",
    });
    expect(run).not.toHaveBeenCalled();
  });

  it.each([
    { existing: null, status: "accepted" },
    { existing: { id: "submission-1" }, status: "duplicate" },
  ] as const)("returns $status after writing the queue record", async ({ existing, status }) => {
    const run = vi.fn(async () => ({ success: true }));
    const db = {
      prepare: vi.fn((sql: string) => ({
        bind: () => ({
          first: async () => sql.includes("plugin_snapshots") ? null : existing,
          run,
        }),
      })),
    } as unknown as D1Database;

    await expect(new SubmissionStore(db).create({
      name: "repo",
      owner: "owner",
      url: "https://github.com/owner/repo",
    })).resolves.toEqual({
      repositoryUrl: "https://github.com/owner/repo",
      status,
    });
    expect(run).toHaveBeenCalledOnce();
  });
});

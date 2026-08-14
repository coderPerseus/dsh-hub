import { describe, expect, it, vi } from "vitest";

import { runCli } from "../src/index";

describe("dshhub CLI", () => {
  it("shows help without requiring a command", async () => {
    const stdout = vi.fn();
    expect(await runCli(["--help"], { stdout, stderr: vi.fn() })).toBe(0);
    expect(stdout).toHaveBeenCalledWith(expect.stringContaining("dshhub search"));
  });

  it("returns stable JSON for agent searches", async () => {
    const stdout = vi.fn();
    const search = vi.fn().mockResolvedValue({
      items: [{ name: "dsh-memory", slug: "owner/dsh-memory" }],
      nextCursor: null,
      total: 1,
    });

    const code = await runCli(
      ["search", "cross", "session", "memory", "--category", "skills", "--limit", "5", "--json"],
      { stdout, stderr: vi.fn() },
      { search, plugin: vi.fn() },
    );

    expect(code).toBe(0);
    expect(search).toHaveBeenCalledWith(expect.objectContaining({
      query: "cross session memory",
      categories: ["skills"],
      limit: 5,
    }));
    expect(JSON.parse(stdout.mock.calls[0][0])).toMatchObject({ total: 1 });
  });

  it("uses exit code 2 for an empty search", async () => {
    const code = await runCli(
      ["search", "missing", "--json"],
      { stdout: vi.fn(), stderr: vi.fn() },
      {
        search: vi.fn().mockResolvedValue({ items: [], nextCursor: null, total: 0 }),
        plugin: vi.fn(),
      },
    );

    expect(code).toBe(2);
  });
});

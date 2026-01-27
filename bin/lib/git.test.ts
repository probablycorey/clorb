import { describe, expect, test } from "bun:test";
import { resolve } from "path";
import { isGitRepo } from "./git.ts";

// Get repo root from test file location (bin/lib/git.test.ts -> repo root)
const repoRoot = resolve(import.meta.dir, "../..");

describe("isGitRepo", () => {
  test("returns true for a git repo", async () => {
    expect(await isGitRepo(repoRoot)).toBe(true);
  });

  test("returns false for non-repo directory", async () => {
    expect(await isGitRepo("/tmp")).toBe(false);
  });
});

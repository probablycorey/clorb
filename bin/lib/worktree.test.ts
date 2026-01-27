import { describe, expect, test } from "bun:test";
import { resolve } from "path";
import { mkdirSync, rmdirSync } from "fs";
import { sanitizeBranchName, generateBranchName, branchExists, findUniqueBranchName, countWorktrees } from "./worktree.ts";

const repoRoot = resolve(import.meta.dir, "../..");

describe("sanitizeBranchName", () => {
  test("lowercases input", () => {
    expect(sanitizeBranchName("MyFeature")).toBe("myfeature");
  });

  test("converts spaces to hyphens", () => {
    expect(sanitizeBranchName("my new feature")).toBe("my-new-feature");
  });

  test("strips special characters", () => {
    expect(sanitizeBranchName("feature! @#$% test")).toBe("feature-test");
  });

  test("handles example from spec", () => {
    expect(sanitizeBranchName("A new feature! That I want")).toBe(
      "a-new-feature-that-i-want"
    );
  });

  test("collapses multiple hyphens", () => {
    expect(sanitizeBranchName("foo---bar")).toBe("foo-bar");
  });

  test("trims leading/trailing hyphens", () => {
    expect(sanitizeBranchName("--foo-bar--")).toBe("foo-bar");
  });

  test("handles empty string", () => {
    expect(sanitizeBranchName("")).toBe("");
  });
});

describe("generateBranchName", () => {
  test("generates human-readable clorb-mon-day-time format", () => {
    const name = generateBranchName();
    // e.g. clorb-jan-26-707am or clorb-dec-5-1145pm
    expect(name).toMatch(/^clorb-(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)-\d{1,2}-\d{1,2}\d{2}(am|pm)$/);
  });
});

describe("branchExists", () => {
  test("returns true for existing branch", async () => {
    expect(await branchExists(repoRoot, "main")).toBe(true);
  });

  test("returns false for non-existent branch", async () => {
    expect(await branchExists(repoRoot, "nonexistent-branch-xyz-123")).toBe(false);
  });
});

describe("findUniqueBranchName", () => {
  test("returns original name if not taken", async () => {
    const result = await findUniqueBranchName(repoRoot, "unique-test-branch-xyz");
    expect(result).toBe("unique-test-branch-xyz");
  });

  test("appends suffix if name exists", async () => {
    // "main" exists, so should get "main-2"
    const result = await findUniqueBranchName(repoRoot, "main");
    expect(result).toBe("main-2");
  });
});

describe("countWorktrees", () => {
  test("returns 0 for empty or non-existent directory", () => {
    expect(countWorktrees("/tmp/clorb-test-nonexistent")).toBe(0);
  });

  test("counts directories in path", () => {
    const testDir = "/tmp/clorb-test-count";
    mkdirSync(testDir, { recursive: true });
    mkdirSync(`${testDir}/proj-a`, { recursive: true });
    mkdirSync(`${testDir}/proj-b`, { recursive: true });

    expect(countWorktrees(testDir)).toBe(2);

    // Cleanup
    rmdirSync(`${testDir}/proj-a`);
    rmdirSync(`${testDir}/proj-b`);
    rmdirSync(testDir);
  });
});

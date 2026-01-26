import { describe, expect, test } from "bun:test";
import { isGitRepo } from "./git.ts";

describe("isGitRepo", () => {
  test("returns true for a git repo", async () => {
    expect(await isGitRepo("/clorb")).toBe(true);
  });

  test("returns false for non-repo directory", async () => {
    expect(await isGitRepo("/tmp")).toBe(false);
  });
});

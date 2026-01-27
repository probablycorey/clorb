import { describe, expect, test } from "bun:test";
import { sanitizeBranchName, generateBranchName } from "./worktree.ts";

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

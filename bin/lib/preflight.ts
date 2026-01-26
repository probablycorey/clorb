import { $ } from "bun";
import { isGitRepo } from "./git.ts";

interface GitStatus {
  isRepo: boolean;
  branch?: string;
  hasUncommittedChanges?: boolean;
  hasUntrackedFiles?: boolean;
  unpushedCommits?: number;
  issues: string[];
}

async function checkGitStatus(path: string): Promise<GitStatus> {
  const status: GitStatus = { isRepo: false, issues: [] };

  // Check if it's a git repo
  status.isRepo = await isGitRepo(path);
  if (!status.isRepo) {
    return status;
  }

  // Get current branch
  try {
    const result = await $`git -C ${path} branch --show-current`.quiet();
    status.branch = result.text().trim();
    if (status.branch !== "main") {
      status.issues.push(`On branch '${status.branch}' (expected 'main')`);
    }
  } catch {
    status.issues.push("Could not determine current branch");
  }

  // Check for uncommitted changes (staged or unstaged)
  try {
    const result = await $`git -C ${path} status --porcelain`.quiet();
    const lines = result.text().trim().split("\n").filter(Boolean);
    const tracked = lines.filter((l) => !l.startsWith("??"));
    const untracked = lines.filter((l) => l.startsWith("??"));

    if (tracked.length > 0) {
      status.hasUncommittedChanges = true;
      status.issues.push(`${tracked.length} uncommitted change(s)`);
    }
    if (untracked.length > 0) {
      status.hasUntrackedFiles = true;
      status.issues.push(`${untracked.length} untracked file(s)`);
    }
  } catch {
    status.issues.push("Could not check for uncommitted changes");
  }

  // Check for unpushed commits
  try {
    const result =
      await $`git -C ${path} rev-list --count @{upstream}..HEAD`.quiet();
    const count = parseInt(result.text().trim(), 10);
    if (count > 0) {
      status.unpushedCommits = count;
      status.issues.push(`${count} unpushed commit(s)`);
    }
  } catch {
    // No upstream or other error - skip this check
  }

  return status;
}

function promptContinue(issues: string[]): boolean {
  console.log("\nGit status check found issues:");
  for (const issue of issues) {
    console.log(`  - ${issue}`);
  }
  console.log();

  const answer = prompt("Continue anyway? [y/N]");
  return answer?.toLowerCase() === "y";
}

export async function verifyGitStatus(path: string): Promise<boolean> {
  const gitStatus = await checkGitStatus(path);
  if (gitStatus.isRepo && gitStatus.issues.length > 0) {
    return promptContinue(gitStatus.issues);
  }
  return true;
}

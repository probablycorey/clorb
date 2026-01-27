import { $ } from "bun";
import { existsSync, readdirSync, statSync } from "fs";
import { basename } from "path";
import { isGitRepo } from "./git.ts";

export function sanitizeBranchName(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "") // strip special chars
    .replace(/\s+/g, "-") // spaces to hyphens
    .replace(/-+/g, "-") // collapse multiple hyphens
    .replace(/^-|-$/g, ""); // trim leading/trailing hyphens
}

export function generateBranchName(): string {
  const now = new Date();
  const month = now.toLocaleDateString("en-US", { month: "short" }).toLowerCase();
  const day = now.getDate();
  const time = now
    .toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
    .toLowerCase()
    .replace(/[:\s]/g, "");
  return `clorb-${month}-${day}-${time}`;
}

export async function branchExists(repoPath: string, branchName: string): Promise<boolean> {
  try {
    await $`git -C ${repoPath} rev-parse --verify refs/heads/${branchName}`.quiet();
    return true;
  } catch {
    return false;
  }
}

export async function findUniqueBranchName(repoPath: string, baseName: string): Promise<string> {
  let candidate = baseName;
  let suffix = 2;

  while (await branchExists(repoPath, candidate)) {
    candidate = `${baseName}-${suffix}`;
    suffix++;
  }

  return candidate;
}

export function countWorktrees(basePath: string): number {
  if (!existsSync(basePath)) {
    return 0;
  }

  try {
    const entries = readdirSync(basePath);
    return entries.filter((entry) => {
      const fullPath = `${basePath}/${entry}`;
      return statSync(fullPath).isDirectory();
    }).length;
  } catch {
    return 0;
  }
}

export async function createWorktree(
  repoPath: string,
  branchName: string,
  worktreePath: string
): Promise<void> {
  await $`git -C ${repoPath} worktree add -b ${branchName} ${worktreePath}`;
}

const WORKTREE_BASE = "/tmp/clorb";

export function getWorktreePath(projectName: string, branchName: string): string {
  const safeName = projectName.replace(/\//g, "-");
  return `${WORKTREE_BASE}/${safeName}-${branchName}`;
}

export interface WorktreeResult {
  worktreePath?: string;
  branchName?: string;
  worktreeCount?: number;
  error?: string;
}

export async function setupWorktree(
  repoPath: string,
  branchInput: string
): Promise<WorktreeResult> {
  // Validate git repo
  if (!(await isGitRepo(repoPath))) {
    return { error: "Not a git repository" };
  }

  // Determine branch name
  const baseBranch = branchInput.trim()
    ? sanitizeBranchName(branchInput)
    : generateBranchName();

  // Find unique branch name
  const branchName = await findUniqueBranchName(repoPath, baseBranch);

  // Build worktree path
  const projectName = basename(repoPath);
  const worktreePath = getWorktreePath(projectName, branchName);

  // Create the worktree
  await createWorktree(repoPath, branchName, worktreePath);

  // Count existing worktrees for nudge
  const worktreeCount = countWorktrees(WORKTREE_BASE);

  return {
    worktreePath,
    branchName,
    worktreeCount,
  };
}

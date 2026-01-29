import { $ } from "bun";
import { basename, join } from "path";
import { homedir } from "os";

function generateBranchName(baseBranch: string): string {
  const now = new Date();
  const month = now.toLocaleDateString("en-US", { month: "short" }).toLowerCase();
  const day = now.getDate();
  const h = String(now.getHours()).padStart(2, "0");
  const m = String(now.getMinutes()).padStart(2, "0");
  const s = String(now.getSeconds()).padStart(2, "0");
  return `clorb/${baseBranch}-${month}${day}-${h}${m}${s}`;
}

export async function getCurrentBranch(repoPath: string): Promise<string> {
  try {
    const result = await $`git -C ${repoPath} rev-parse --abbrev-ref HEAD`.quiet();
    const branch = result.text().trim();
    return branch === "HEAD" ? "detached" : branch;
  } catch {
    return "unknown";
  }
}

async function copyWorkingChanges(sourceRepo: string, worktreePath: string): Promise<void> {
  await $`rsync -a --exclude='.git' ${sourceRepo}/ ${worktreePath}/`;
}

async function copyEnvFiles(sourceRepo: string, worktreePath: string): Promise<void> {
  await $`rsync -a --include='.env*' --exclude='*' ${sourceRepo}/ ${worktreePath}/`;
}

function getWorktreePath(projectName: string, branchName: string): string {
  const base = join(homedir(), ".clorb", "worktrees");
  const safeBranch = branchName.replace(/\//g, "-");
  return join(base, projectName, safeBranch);
}

export interface WorktreeResult {
  worktreePath?: string;
  branchName?: string;
  error?: string;
}

export async function listBranches(repoPath: string): Promise<string[]> {
  const result = await $`git -C ${repoPath} branch --format='%(refname:short)'`.quiet();
  return result
    .text()
    .trim()
    .split("\n")
    .filter((b) => b.length > 0);
}

export async function setupWorktreeFromCurrent(repoPath: string): Promise<WorktreeResult> {
  const currentBranch = await getCurrentBranch(repoPath);
  const branchName = generateBranchName(currentBranch);
  const projectName = basename(repoPath);
  const worktreePath = getWorktreePath(projectName, branchName);

  await $`git -C ${repoPath} worktree add -b ${branchName} ${worktreePath}`;
  await copyWorkingChanges(repoPath, worktreePath);

  return { worktreePath, branchName };
}

export async function setupWorktreeFromBranch(
  repoPath: string,
  branchName: string
): Promise<WorktreeResult> {
  const projectName = basename(repoPath);
  const worktreePath = getWorktreePath(projectName, branchName);

  // Checkout existing branch directly (no -b flag)
  await $`git -C ${repoPath} worktree add ${worktreePath} ${branchName}`;
  await copyEnvFiles(repoPath, worktreePath);

  return { worktreePath, branchName };
}

export async function setupWorktreeFromOriginMain(
  repoPath: string,
  customBranchName?: string,
  createDraftPr?: boolean
): Promise<WorktreeResult> {
  console.log("Fetching latest from origin...");
  await $`git -C ${repoPath} fetch origin`;

  const branchName = customBranchName?.trim()
    ? customBranchName.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-")
    : generateBranchName("main");

  const projectName = basename(repoPath);
  const worktreePath = getWorktreePath(projectName, branchName);

  await $`git -C ${repoPath} worktree add -b ${branchName} ${worktreePath} origin/main`;
  await copyEnvFiles(repoPath, worktreePath);

  if (createDraftPr) {
    await $`git -C ${worktreePath} commit --allow-empty -m "WIP"`;
    console.log("Pushing branch to origin...");
    await $`git -C ${worktreePath} push -u origin ${branchName}`;
    console.log("Creating draft PR...");
    const prTitle = customBranchName?.trim() || branchName;
    const result = await $`gh pr create --draft --title ${prTitle} --body "Work in progress"`.cwd(worktreePath);
    console.log(result.text().trim());
  }

  return { worktreePath, branchName };
}

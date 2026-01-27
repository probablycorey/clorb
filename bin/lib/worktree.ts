import { $ } from "bun";
import { existsSync, readdirSync, statSync } from "fs";

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

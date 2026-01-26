import { $ } from "bun";

export async function isGitRepo(path: string): Promise<boolean> {
  try {
    await $`git -C ${path} rev-parse --git-dir`.quiet();
    return true;
  } catch {
    return false;
  }
}

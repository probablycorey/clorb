import { $ } from "bun";
import { resolve, dirname, basename } from "path";

const SCRIPT_DIR = dirname(Bun.main);
const REPO_DIR = dirname(SCRIPT_DIR);
const IMAGE_NAME = "clorb";

export async function dockerExists(): Promise<boolean> {
  try {
    await $`docker --version`.quiet();
    return true;
  } catch {
    return false;
  }
}

export async function imageExists(): Promise<boolean> {
  try {
    await $`docker image inspect ${IMAGE_NAME}`.quiet();
    return true;
  } catch {
    return false;
  }
}

export async function buildImage() {
  console.log("Building clorb image...");
  await $`docker build -t ${IMAGE_NAME} ${REPO_DIR}`;
}

export async function getGhToken(): Promise<string | null> {
  try {
    const result = await $`gh auth token`.quiet();
    return result.text().trim() || null;
  } catch {
    return null;
  }
}

export async function runContainer(
  targetPath: string,
  ghToken: string | null
): Promise<number> {
  const dirName = basename(targetPath);

  // Build image if needed
  if (!(await imageExists())) {
    console.log("Building clorb image (first run only)...");
    await buildImage();
  }

  // Spawn the shell script for TTY handling
  const runScript = resolve(SCRIPT_DIR, "run.sh");

  // Filter out undefined env values
  const baseEnv: Record<string, string> = {};
  for (const [k, v] of Object.entries(process.env)) {
    if (v !== undefined) baseEnv[k] = v;
  }

  const env: Record<string, string> = {
    ...baseEnv,
    CLORB_TARGET_PATH: targetPath,
    CLORB_DIR_NAME: dirName,
    CLORB_IMAGE_NAME: IMAGE_NAME,
  };

  if (ghToken) {
    env.GH_TOKEN = ghToken;
  }

  const proc = Bun.spawn(["bash", runScript], {
    stdio: ["inherit", "inherit", "inherit"],
    env,
  });

  return await proc.exited;
}

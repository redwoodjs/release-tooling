import semver from "semver";
import { $, chalk } from "zx";

import { CustomError } from "./custom_error.js";
import { unwrap } from "./zx_helpers.js";

export async function assertWorkTreeIsClean() {
  const workTreeIsClean = unwrap(await $`git status -s`) === "";
  if (!workTreeIsClean) {
    throw new CustomError(
      `The working tree at ${chalk.magenta(process.cwd())} isn't clean. Commit or stash your changes`,
    );
  }
  console.log("✨ The working tree is clean");
}

export async function branchExists(branch: string) {
  return !!unwrap(await $`git branch --list ${branch}`);
}

export async function assertBranchExistsAndTracksRemote(branch: string, remote: string) {
  if (!(await branchExists(branch))) {
    throw new CustomError([
      `The ${chalk.magenta(branch)} branch doesn't exist locally. Check it out from the Redwood remote:`,
      "",
      chalk.green(`  git checkout -b ${branch} ${remote}/${branch}`),
    ].join("\n"));
  }
  console.log(`🏠 The ${chalk.magenta(branch)} branch exists locally`);

  const trackingBranch = unwrap(await $`git rev-parse --abbrev-ref ${branch}@{upstream}`);
  if (trackingBranch === `${remote}/${branch}`) {
    console.log(`🆗 The ${chalk.magenta(branch)} branch tracks ${chalk.magenta(`${remote}/${branch}`)}`);
    return;
  }

  throw new CustomError([
    `The ${chalk.magenta(branch)} branch doesn't track ${chalk.magenta(`${remote}/${branch}`)}`,
    `It's currently tracking ${chalk.magenta(trackingBranch)}`,
    "",
    `Make it track the remote with:`,
    "",
    chalk.green(`  git branch -u ${remote}/${branch}`),
  ].join("\n"));
}

export async function pullBranch(branch: string, remote: string) {
  await $`git switch ${branch}`;
  await $`git pull ${remote} ${branch}`;
}

export async function pushBranch(branch: string, remote: string) {
  await $`git push -u ${remote} ${branch}`;
}

export async function getReleaseBranches() {
  const stdout = unwrap(await $`git branch --list release/*`);
  return getReleaseBranchesFromStdout(stdout);
}

export function getReleaseBranchesFromStdout(stdout: string) {
  if (stdout === "") {
    return [];
  }

  const releaseBranches = stdout
    .split("\n")
    .map((branch) => branch.trim().replace("* ", ""))
    .sort((releaseBranchA, releaseBranchB) => {
      const [, , versionA] = releaseBranchA.split("/");
      const [, , versionB] = releaseBranchB.split("/");
      return semver.compare(versionA, versionB);
    });

  return releaseBranches.reverse();
}

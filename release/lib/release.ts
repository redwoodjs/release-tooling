import { execaCommand } from "execa";
import semver from "semver";
import { $, cd, chalk, fs, path, question } from "zx";

import { branchExists, pushBranch } from "@lib/branches.js";
import {
  cherryPickCommits,
  reportCommitsEligibleForCherryPick,
} from "@lib/cherry_pick_commits.js";
import { commitIsInRef, getCommitHash, sanitizeMessage } from "@lib/commits.js";
import { consoleBoxen, logSection, separator } from "@lib/console_helpers.js";
import { CustomError } from "@lib/custom_error.js";
import { logs } from "@lib/logs.js";
import {
  closeMilestone,
  createMilestone,
  getMilestone,
  getPrsWithMilestone,
  sortPrsByMergedAt,
  updatePrMilestone,
} from "@lib/milestones.js";
import { resIsYes } from "@lib/prompts.js";
import { unwrap } from "@lib/zx_helpers.js";

import type { ReleaseOptions } from "./types.js";

export async function assertLoggedInToNpm() {
  try {
    await $`npm whoami`;
    console.log("🔑 Logged in to NPM");
  } catch (error) {
    throw new CustomError(
      [
        `You're Not logged in to NPM. Log in with ${chalk.magenta("npm login")}`,
      ].join("\n"),
    );
  }
}

export async function getLatestReleaseOrThrow() {
  const latestRelease = unwrap(
    await $`git tag --sort="-version:refname" --list "v?.?.?" | head -n 1`,
  );
  const ok = resIsYes(
    await question(
      `The latest release is ${chalk.magenta(latestRelease)}? [Y/n] > `,
    ),
  );
  if (!ok) {
    throw new CustomError("The latest release isn't correct");
  }
  return latestRelease;
}

export async function getNextReleaseOrThrow({
  latestRelease,
  desiredSemver,
}: Pick<ReleaseOptions, "latestRelease" | "desiredSemver">) {
  const nextRelease = `v${semver.inc(latestRelease, desiredSemver)}`;
  const ok = resIsYes(
    await question(
      `The next release is ${chalk.magenta(nextRelease)}? [Y/n] > `,
    ),
  );
  if (!ok) {
    throw new CustomError("The next release isn't correct");
  }
  return nextRelease;
}

/**
 * If the git tag for the desired semver already exists, this script was run before, but not to completion.
 * The git tag is one of the last steps, so we need to delete it first.
 */
export async function assertGitTagDoesntExist({
  nextRelease,
}: Pick<ReleaseOptions, "nextRelease">) {
  const gitTagAlreadyExists = unwrap(await $`git tag -l ${nextRelease}`);
  if (gitTagAlreadyExists) {
    throw new CustomError("The git tag already exists");
  }
}

export async function release(options: ReleaseOptions) {
  logSection("Switching to the release branch");
  const releaseBranch = [
    "release",
    options.desiredSemver,
    options.nextRelease,
  ].join("/");
  await switchToReleaseBranch({ ...options, releaseBranch });

  logSection("Seeing if the release branch needs updated based on milestones");
  await updateReleaseBranch({ ...options, releaseBranch });

  logSection("Versioning or re-versioning the docs if necessary");
  const message =
    options.desiredSemver === "patch"
      ? `Ok to ${chalk.underline("reversion")} ${chalk.magenta(options.nextRelease)} docs? [Y/n] > `
      : `Ok to ${chalk.underline("version")} docs to ${chalk.magenta(options.nextRelease)}? [Y/n] > `;
  const okToVersionDocs = resIsYes(await question(message));
  if (okToVersionDocs) {
    await versionDocs(options.nextRelease);
  }

  logSection("Cleaning, installing, and updating package versions");
  await question(
    "Press anything to clean, install, and update package versions > ",
  );
  await $`git clean -fxd`;
  await $`yarn install`;
  await updatePackageVersions(options);

  logSection("Build, lint, test");
  await question("Press anything to run build, lint, and test > ");
  await $`yarn build`;
  await $`yarn lint:fw`;
  await $`yarn test`;

  logSection("Publishing to NPM. Get ready to enter your NPM OTP");
  const ok = resIsYes(await question(`Ok to publish to NPM? [Y/n] > `));
  if (!ok) {
    throw new CustomError("See you later!", "👋");
  }
  // Temporarily remove `packages/create-redwood-app` from the workspaces field so that we can publish it separately later.
  const undoRemoveCreateRedwoodAppFromWorkspaces =
    await removeCreateRedwoodAppFromWorkspaces();
  await publish();
  // Undo the temporary commit and publish CRWA.
  logSection("Updating create-redwood-app templates and publishing to NPM");
  await undoRemoveCreateRedwoodAppFromWorkspaces();
  await question("Press anything to update create-redwood-app templates > ");
  await updateCreateRedwoodAppTemplates();
  await publish();

  logSection("Consolidating commits and tagging the release");
  await question("Press anything consolidate commits and tag > ");
  // This combines the update package versions commit and update CRWA commit into one.
  await $`git reset --soft HEAD~2`;
  await $`git commit -m "${options.nextRelease}"`;
  await $`git tag -am ${options.nextRelease} "${options.nextRelease}"`;

  logSection("Pushing the release branch");
  await question(
    `Press anything to push the ${chalk.magenta(options.nextRelease)} tag to ${chalk.magenta(options.remote)} > `,
  );
  await $`git push -u ${options.remote} ${releaseBranch} --follow-tags`;

  logSection("Closing the milestone, and merging the release branch into next");
  await question(
    `Press anything to close the ${chalk.magenta(options.nextRelease)} milestone > `,
  );
  try {
    await closeMilestone(options.nextRelease);
  } catch (error) {
    console.log();
    consoleBoxen(
      "✋ Couldn't close the milestone",
      "You'll need to do that manually unfortunately. Sorry!",
    );
  }

  logSection("Merging the release branch into next");
  await question(
    `Press anything to merge ${chalk.magenta(releaseBranch)} into ${chalk.magenta("next")} > `,
  );
  await mergeReleaseBranch({ ...options, releaseBranch });
}

async function switchToReleaseBranch({
  releaseBranch,
  latestRelease,
}: Pick<ReleaseOptions, "latestRelease"> & { releaseBranch: string }) {
  const releaseBranchExists = await branchExists(releaseBranch);

  if (releaseBranchExists) {
    console.log(
      `Checking out the ${chalk.underline("existing")} ${chalk.magenta(releaseBranch)} release branch`,
    );
    await $`git switch ${releaseBranch}`;
  } else {
    const desiredSemver = releaseBranch.split("/")[1];
    let checkoutFromRef;

    switch (desiredSemver) {
      case "major":
        checkoutFromRef = "main";
        break;
      case "minor":
        checkoutFromRef = "next";
        break;
      case "patch":
        checkoutFromRef = latestRelease;
        break;
    }

    const ok = resIsYes(
      await question(
        `Ok to checkout a ${chalk.underline("new")} release branch, ${chalk.magenta(
          releaseBranch,
        )}, from ${chalk.magenta(checkoutFromRef)}? [Y/n] > `,
      ),
    );
    if (!ok) {
      throw new CustomError("See you later!", "👋");
    }

    await $`git checkout -b ${releaseBranch} ${checkoutFromRef}`;
  }
}

async function updateReleaseBranch(
  options: ReleaseOptions & { releaseBranch: string },
) {
  const prs = await getPrsWithMilestone(options.nextRelease);
  const nextReleasePatchPrs = await getPrsWithMilestone("next-release-patch");
  prs.push(...nextReleasePatchPrs);

  if (options.desiredSemver === "minor") {
    const nextReleasePrs = await getPrsWithMilestone("next-release");
    prs.push(...nextReleasePrs);
  }

  prs.sort(sortPrsByMergedAt);
  logs.push("prs", prs);

  let milestone;
  try {
    milestone = await getMilestone(options.nextRelease);
  } catch (_error) {
    milestone = await createMilestone(options.nextRelease);
  }

  let shouldCherryPick = false;

  for (const pr of prs) {
    pr.line = pr.mergeCommit.messageHeadline;

    if (!(await commitIsInRef(options.releaseBranch, pr.line))) {
      shouldCherryPick = true;
      const line = unwrap(
        await $`git log next --oneline --no-abbrev-commit --grep ${sanitizeMessage(pr.line)}`,
      );

      if (line === "") {
        console.log();
        consoleBoxen(
          "✋ Missing commit",
          [
            "Couldn't find the commit for",
            "",
            `  ${pr.line}`,
            "",
            `in the ${chalk.magenta("next")} branch.`,
            "This is commonly because you haven't properly triaged all PRs yet",
            "",
            "You have two options",
            "  - Cancel the release process (recommended)",
            "  - Exclude PR from release",
          ].join("\n"),
        );
        const res = await question(
          "What do you want to do? [C(ancel)/e(xclude)] > ",
        );

        if (res !== "e" && res !== "exclude") {
          throw new CustomError("Re-run the release script after triaging");
        }

        // PRs that don't have a hash are not cherry-picked to the release
        // branch.
        pr.hash = undefined;
      } else {
        pr.hash = await getCommitHash(line);
      }
    } else {
      if (pr.milestone.title !== options.nextRelease) {
        await updatePrMilestone(pr.id, milestone.id);
      }
    }
  }

  if (!shouldCherryPick) {
    consoleBoxen("✨ Done", "No commits to triage");
    return;
  }

  const prsEligibleForCherryPick = prs.filter((pr) => pr.hash);
  reportCommitsEligibleForCherryPick(prsEligibleForCherryPick);

  await cherryPickCommits(prsEligibleForCherryPick, {
    range: { from: "next", to: options.releaseBranch },
    afterCherryPick: async (pr) => {
      await updatePrMilestone(pr.id, milestone.id);
    },
  });

  console.log(separator);
  const okToPushBranch = resIsYes(
    await question(
      `Ok to push ${chalk.magenta(options.releaseBranch)} to ${chalk.magenta(options.remote)}? [Y/n] > `,
    ),
  );
  if (okToPushBranch) {
    await pushBranch(options.releaseBranch, options.remote);
    await $`open https://github.com/redwoodjs/redwood/compare/${options.latestRelease}...${options.releaseBranch}`;
  }
}

async function versionDocs(nextRelease: string) {
  const nextDocsVersion = nextRelease.slice(1, -2);
  await cd("./docs");

  // If the versioned docs directory already exists (the case for patch releases), remove it and its entry from versions.json.
  if (await fs.pathExists(`./versioned_docs/version-${nextDocsVersion}`)) {
    await $`rm -rf ./versioned_docs/version-${nextDocsVersion}`;
    const versions = await fs.readJson("./versions.json");
    await fs.writeJson("./versions.json", versions.slice(1));
  }

  await $`yarn`;
  await $`yarn clear`;
  await $`yarn docusaurus docs:version ${nextDocsVersion}`;
  await $`git add .`;
  try {
    await $`git commit -m "Version docs to ${nextDocsVersion}"`;
  } catch (error) {
    if (error.stdout.includes("nothing to commit, working tree clean")) {
      console.log("✨ No docs to version");
    } else {
      throw error;
    }
  }
  await cd("../");
}

async function updatePackageVersions({
  nextRelease,
}: Pick<ReleaseOptions, "nextRelease">) {
  const lernaVersion = nextRelease.replace("v", "");
  // TODO(jtoar): Is this missing a peer dep?
  // See docs on these options at https://github.com/lerna/lerna/tree/main/libs/commands/version#options.
  await $`yarn lerna version ${lernaVersion} --no-git-tag-version --no-push --force-publish --exact --yes`;

  // As far as I can tell, `lerna version` doesn't update peer dependencies,
  // so we need to do that manually. See https://github.com/lerna/lerna/issues/1575.
  await updateRedwoodJsDependencyVersions(
    "packages/api-server/package.json",
    lernaVersion,
  );
  await updateRedwoodJsDependencyVersions(
    "packages/storybook/package.json",
    lernaVersion,
  );
  await updateRedwoodJsDependencyVersions(
    "packages/cli-packages/storybook-vite/package.json",
    lernaVersion,
  );

  await $`yarn install`;
  await $`yarn dedupe`;
  await $`git add .`;

  for (const templatePath of [
    "packages/create-redwood-app/templates/ts",
    "packages/create-redwood-app/templates/js",
    "__fixtures__/test-project",
  ]) {
    await updateRedwoodJsDependencyVersions(
      path.join(templatePath, "package.json"),
      lernaVersion,
    );
    await updateRedwoodJsDependencyVersions(
      path.join(templatePath, "api", "package.json"),
      lernaVersion,
    );
    await updateRedwoodJsDependencyVersions(
      path.join(templatePath, "web", "package.json"),
      lernaVersion,
    );
  }

  await $`yarn install`;
  await $`git commit -am "chore: update package versions to ${nextRelease}"`;
}

/** Iterates over `@redwoodjs/*` dependencies in a package.json and updates their version */
async function updateRedwoodJsDependencyVersions(
  packageConfigPath: string,
  version: string,
) {
  const packageConfig = await fs.readJson(packageConfigPath);

  for (const dep of Object.keys(packageConfig.dependencies ?? {}).filter(
    isRedwoodJsPackage,
  )) {
    packageConfig.dependencies[dep] = version;
  }
  for (const dep of Object.keys(packageConfig.devDependencies ?? {}).filter(
    isRedwoodJsPackage,
  )) {
    packageConfig.devDependencies[dep] = version;
  }
  for (const dep of Object.keys(packageConfig.peerDependencies ?? {}).filter(
    isRedwoodJsPackage,
  )) {
    packageConfig.peerDependencies[dep] = version;
  }

  fs.writeJson(packageConfigPath, packageConfig, { spaces: 2 });
}

const isRedwoodJsPackage = (pkg: string) =>
  pkg.startsWith("@redwoodjs/") ||
  pkg.startsWith("storybook-framework-redwoodjs-vite");

async function removeCreateRedwoodAppFromWorkspaces() {
  const frameworkPackageConfig = await fs.readJson("./package.json");
  const packagePaths = (await $`yarn workspaces list --json`).stdout
    .trim()
    .split("\n")
    .map(JSON.parse)
    .filter(({ name }) => name)
    .map(({ location }) => location);

  frameworkPackageConfig.workspaces = packagePaths.filter(
    (packagePath) => packagePath !== "packages/create-redwood-app",
  );
  fs.writeJson("./package.json", frameworkPackageConfig, {
    spaces: 2,
  });
  await $`git commit -am "chore: temporary update to workspaces"`;

  return () => $`git reset --hard HEAD~1`;
}

async function publish() {
  try {
    // We're using execa here and not zx because zx doesn't handle the prompt for the otp.
    await execaCommand("yarn lerna publish from-package", { stdio: "inherit" });
  } catch {
    console.log();
    consoleBoxen(
      "✋ Publishing failed",
      [
        "But don't worry! You can usually recover from this by...",
        "",
        "1. Getting rid of the changes to the `package.json`s in the Redwood monorepo (lerna will make them again)",
        `2. In another terminal in the Redwood monorepo, running ${chalk.green("yarn lerna publish from-package")}`,
      ].join("\n"),
    );
    console.log();
    await question(
      "When you've finished the steps above, press anything to continue > ",
    );
  }
}

async function updateCreateRedwoodAppTemplates() {
  const originalCwd = process.cwd();
  cd("./packages/create-redwood-app/templates/ts");
  await $`rm -f yarn.lock`;
  await $`touch yarn.lock`;
  await $`yarn install`;
  cd("../..");
  await $`yarn ts-to-js`;
  await $`git add .`;
  await $`git commit -m "chore: update create-redwood-app templates"`;
  cd(originalCwd);
}

export async function mergeReleaseBranch(
  options: ReleaseOptions & { releaseBranch: string },
) {
  await $`git switch next`;

  try {
    await $`git merge ${options.releaseBranch}`;
  } catch (_error) {
    console.log();
    consoleBoxen(
      "✋ Couldn't cleanly merge the release branch into next",
      `Resolve the conflicts and run ${chalk.green("git merge --continue")}`,
    );
    console.log();
    await question("Press anything to continue > ");
  }

  logSection("Pushing the next branch");
  const okToPushBranch = resIsYes(
    await question(
      `Ok to push ${chalk.magenta("next")} to ${chalk.magenta(options.remote)}? [Y/n] > `,
    ),
  );
  if (okToPushBranch) {
    await pushBranch("next", options.remote);
  }

  logSection("Deleting the release branch");
  const okToDeleteBranches = resIsYes(
    await question(
      `Ok to delete ${chalk.magenta(options.releaseBranch)}? [Y/n] > `,
    ),
  );
  if (okToDeleteBranches) {
    await $`git switch main`;
    await $`git branch -d ${options.releaseBranch}`;
    await $`git push ${options.remote} --delete ${options.releaseBranch}`;
  }
}

import { assertWorkTreeIsClean } from "@lib/branches.js";
import { consoleBoxen, logSection } from "@lib/console_helpers.js";
import { CustomError } from "@lib/custom_error.js";
import { assertRwfwPathAndSetCwd } from "@lib/cwd.js";
import { getRedwoodRemote } from "@lib/get_redwood_remote.js";
import { setUpLogs } from "@lib/logs.js";
import { assertNoNoMilestonePrs } from "@lib/milestones.js";
import { getDesiredSemver } from "@lib/prompts.js";

import {
  assertGitTagDoesntExist,
  assertLoggedInToNpm,
  getLatestReleaseOrThrow,
  getNextReleaseOrThrow,
  release,
} from "./lib/release.js";

try {
  setUpLogs(new URL("../release_log.json", import.meta.url));

  logSection("Making sure you're logged in to npm");
  await assertLoggedInToNpm();

  logSection("Getting the path to the Redwood monorepo via RWFW_PATH and cd-ing there");
  await assertRwfwPathAndSetCwd();

  logSection("Asserting that the work tree is clean in the Redwood monorepo");
  await assertWorkTreeIsClean();
  await assertNoNoMilestonePrs();

  logSection("Getting the name of the GitHub remote for the Redwood monorepo");
  const remote = await getRedwoodRemote();

  logSection("Getting the desired semver for the next release");
  const desiredSemver = await getDesiredSemver();
  const latestRelease = await getLatestReleaseOrThrow();
  const nextRelease = await getNextReleaseOrThrow({ latestRelease, desiredSemver });
  await assertGitTagDoesntExist({ nextRelease });

  await release({ latestRelease, nextRelease, desiredSemver, remote });
} catch (error) {
  process.exitCode = 1;

  if (error instanceof CustomError) {
    consoleBoxen(error.title, error.message);
  } else {
    throw error;
  }
}

import "dotenv/config";

import { assertGitHubToken } from "@lib/assert_github_token.js";
import { assertBranchExistsAndTracksRemote, assertWorkTreeIsClean, pullBranch } from "@lib/branches.js";
import { consoleBoxen, logSection } from "@lib/console_helpers.js";
import { CustomError } from "@lib/custom_error.js";
import { assertRwfwPathAndSetCwd } from "@lib/cwd.js";
import { getRedwoodRemote } from "@lib/get_redwood_remote.js";
import { setUpLogs } from "@lib/logs.js";
import { fetchNotes } from "@lib/notes.js";

import { getRange } from "./lib/get_range.js";
import { triageRange } from "./lib/triage.js";

try {
  setUpLogs(new URL("../triage_log.json", import.meta.url));

  assertGitHubToken();

  logSection("Getting the path to the Redwood monorepo via RWFW_PATH and cd-ing there");
  await assertRwfwPathAndSetCwd();
  logSection("Asserting that the work tree in RWFW_PATH is clean");
  await assertWorkTreeIsClean();

  logSection("Getting the name of the GitHub remote for the Redwood monorepo");
  const remote = await getRedwoodRemote();

  logSection("Getting release branches and the range to triage");
  const range = await getRange();

  logSection(`Making sure the ${range.from} and ${range.to} branches exist locally and track the remote (${remote})`);
  await assertBranchExistsAndTracksRemote(range.from, remote);
  await assertBranchExistsAndTracksRemote(range.to, remote);

  logSection(
    `Pulling down the latest ${range.from} and ${range.to} branches from the remote (${remote}) and fetching git notes`,
  );
  await pullBranch(range.from, remote);
  await pullBranch(range.to, remote);
  await fetchNotes(remote);

  logSection(`Resolving the symmetric difference between ${range.from} and ${range.to} (${range.from}...${range.to})`);
  await triageRange(range, { remote });
} catch (error) {
  process.exitCode = 1;

  if (error instanceof CustomError) {
    consoleBoxen(error.title, error.message);
  } else {
    throw error;
  }
}

import 'dotenv/config'

import { assertBranchExistsAndTracksRemote, assertWorkTreeIsClean, pullBranch } from '@lib/branches.js'
import { assertGitHubToken } from '@lib/assert_github_token.js'
import { consoleBoxen, separator } from '@lib/console_helpers.js'
import { CustomError } from '@lib/custom_error.js'
import { assertRwfwPathAndSetCwd } from '@lib/cwd.js'
import { getRedwoodRemote } from '@lib/get_redwood_remote.js'
import { setUpLogs } from '@lib/logs.js'
import { fetchNotes } from '@lib/notes.js'

import { getRange } from './lib/get_range.js'
import { triageRange } from "./lib/triage.js";

try {
  setUpLogs(new URL('../triage_log.json', import.meta.url))

  assertGitHubToken()

  await assertRwfwPathAndSetCwd()
  console.log(separator)
  await assertWorkTreeIsClean()

  console.log(separator)
  const remote = await getRedwoodRemote()

  console.log(separator)
  const range = await getRange()

  console.log(separator)
  await assertBranchExistsAndTracksRemote(range.from, remote)
  await assertBranchExistsAndTracksRemote(range.to, remote)

  console.log(separator)
  await pullBranch(range.from, remote)
  await pullBranch(range.to, remote)
  await fetchNotes(remote)

  console.log(separator)
  await triageRange(range, { remote });
} catch (error) {
  process.exitCode = 1;

  if (error instanceof CustomError) {
    consoleBoxen(error.title, error.message);
  } else {
    throw error;
  }
}

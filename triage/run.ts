import { consoleBoxen } from '@lib/boxen.js'
import { setCwd } from '@lib/cwd.js'
import { CustomError } from '@lib/error.js'
import { assertBranchExists, assertWorkTreeIsClean, getRedwoodRemote } from '@lib/git.js'
import { fetchNotes, pullBranch } from '@lib/github.js'

import { getOptions } from './lib/options.js'
import { triageRange } from "./lib/triage.js";

try {
  await setCwd()
  await assertWorkTreeIsClean()
  const remote = await getRedwoodRemote()

  const options = await getOptions()
  await assertBranchExists(options.range.from)
  await assertBranchExists(options.range.to)

  await pullBranch(options.range.from, remote)
  await pullBranch(options.range.to, remote)
  await fetchNotes(remote)

  await triageRange(options.range, { remote });
} catch (error) {
  process.exitCode = 1;

  if (error instanceof CustomError) {
    consoleBoxen(error.title, error.message);
  } else {
    throw error;
  }
}

import { chalk } from 'zx'

import { consoleBoxen, separator } from '@lib/console_helpers.js'
import { setCwd } from '@lib/set_cwd.js'
import { CustomError } from '@lib/custom_error.js'
import { assertBranchExists, assertWorkTreeIsClean, getRedwoodRemote } from '@lib/git.js'
import { fetchNotes, pullBranch } from '@lib/github.js'

import { getOptions } from './lib/options.js'
import { triageRange } from "./lib/triage.js";

try {
  await setCwd()

  console.log(separator)
  await assertWorkTreeIsClean()

  console.log(separator)
  const remote = await getRedwoodRemote()

  console.log(separator)
  const options = await getOptions()

  console.log(separator)
  await assertBranchExists(options.range.from)
  await assertBranchExists(options.range.to)

  console.log(separator)
  await pullBranch(options.range.from, remote)
  await pullBranch(options.range.to, remote)
  await fetchNotes(remote)

  console.log(separator)
  await triageRange(options.range, { remote });
} catch (error) {
  process.exitCode = 1;

  if (error instanceof CustomError) {
    consoleBoxen(error.title, error.message);
  } else {
    throw error;
  }
}

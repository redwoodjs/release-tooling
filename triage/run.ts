import { consoleBoxen } from '@lib/boxen.js'
import { setCwd } from '@lib/cwd.js'
import { CustomError } from '@lib/error.js'
import { assertBranchExists, assertWorkTreeIsClean } from '@lib/git.js'
import { fetchNotes, pullBranch } from '@lib/github.js'

import { getOptions } from './lib/options.js'
import { triageRange } from "./lib/triage.js";

try {
  setCwd()
  await assertWorkTreeIsClean()

  const options = await getOptions()
  await assertBranchExists(options.range.from)
  await assertBranchExists(options.range.to)
  await pullBranch(options.range.from)
  await pullBranch(options.range.to)
  await fetchNotes()

  await triageRange(options.range);
} catch (error) {
  process.exitCode = 1;

  if (error instanceof CustomError) {
    consoleBoxen("👷 Heads up", error.message);
  } else {
    throw error;
  }
}

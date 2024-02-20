import { consoleBoxen } from '@lib/boxen.js'
import { setCwd } from '@lib/cwd.js'
import { CustomError } from '@lib/error.js'
import { assertWorkTreeIsClean } from '@lib/git.js'
import { getDesiredSemver } from '@lib/prompts.js'

import { assertGitTagDoesntExist, getLatestReleaseOrThrow, getNextReleaseOrThrow } from './lib/x.js'
import { assertNoNoMilestonePrs } from './lib/milestones.js'
import { release } from './lib/release.js'

try {
  setCwd()
  await assertWorkTreeIsClean()
  await assertNoNoMilestonePrs()

  const desiredSemver = await getDesiredSemver()
  const latestRelease = await getLatestReleaseOrThrow()
  const nextRelease = await getNextReleaseOrThrow({ latestRelease, desiredSemver })
  await assertGitTagDoesntExist({ nextRelease })

  await release({ latestRelease, nextRelease, desiredSemver })
} catch (error) {
  process.exitCode = 1;

  if (error instanceof CustomError) {
    consoleBoxen(error.title, error.message);
  } else {
    throw error;
  }
}
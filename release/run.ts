import { consoleBoxen, separator } from '@lib/console_helpers.js'
import { setCwd } from '@lib/set_cwd.js'
import { CustomError } from '@lib/custom_error.js'
import { assertWorkTreeIsClean, getRedwoodRemote } from '@lib/git.js'
import { getDesiredSemver } from '@lib/prompts.js'

import { assertNoNoMilestonePrs } from './lib/milestones.js'
import { assertLoggedInToNpm, assertGitTagDoesntExist, getLatestReleaseOrThrow, getNextReleaseOrThrow, release } from './lib/release.js'

try {
  await assertLoggedInToNpm()

  console.log(separator)
  await setCwd()

  console.log(separator)
  await assertWorkTreeIsClean()
  await assertNoNoMilestonePrs()

  console.log(separator)
  const remote = await getRedwoodRemote()

  console.log(separator)
  const desiredSemver = await getDesiredSemver()
  const latestRelease = await getLatestReleaseOrThrow()
  const nextRelease = await getNextReleaseOrThrow({ latestRelease, desiredSemver })
  await assertGitTagDoesntExist({ nextRelease })

  console.log(separator)
  await release({ latestRelease, nextRelease, desiredSemver, remote })
} catch (error) {
  process.exitCode = 1;

  if (error instanceof CustomError) {
    consoleBoxen(error.title, error.message);
  } else {
    throw error;
  }
}

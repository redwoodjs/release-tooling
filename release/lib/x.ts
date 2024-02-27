import semver from 'semver'
import { chalk, question, $ } from 'zx'

import { CustomError } from '@lib/error.js'
import { resIsYes } from '@lib/prompts.js'
import { unwrap } from '@lib/zx_helpers.js'

import { ReleaseOptions } from './types.js' 

export async function getLatestReleaseOrThrow() {
  const latestRelease = unwrap(
    await $`git tag --sort="-version:refname" --list "v?.?.?" | head -n 1`
  )
  let ok = resIsYes(await question(
    `The latest release is ${chalk.magenta(latestRelease)}? [Y/n] > `
  ))
  if (!ok) {
    throw new CustomError("The latest release isn't correct")
  }
  return latestRelease
}

export async function getNextReleaseOrThrow({ latestRelease, desiredSemver }: Pick<ReleaseOptions, 'latestRelease' | 'desiredSemver'>) {
  const nextRelease = `v${semver.inc(latestRelease, desiredSemver)}`
  const ok = resIsYes(
    await question(
      `The next release is ${chalk.magenta(nextRelease)}? [Y/n] > `
    )
  )
  if (!ok) {
    throw new CustomError("The next release isn't correct")
  }
  return nextRelease
}

/**
 * If the git tag for the desired semver already exists, this script was run before, but not to completion.
 * The git tag is one of the last steps, so we need to delete it first.
 */
export async function assertGitTagDoesntExist({ nextRelease }: Pick<ReleaseOptions, | 'nextRelease'>) {
  const gitTagAlreadyExists = unwrap(await $`git tag -l ${nextRelease}`)
  if (gitTagAlreadyExists) {
    throw new CustomError('The git tag already exists')
  }
}

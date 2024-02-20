import semver from 'semver'
import { $ } from 'zx'

import { CustomError } from './error.js'
import { unwrap } from './zx_helpers.js'

/** Gets release branches (e.g. `release/major/v7.0.0`, etc.) */
export async function getReleaseBranches() {
  const releaseBranchesStdout = unwrap(await $`git branch --list release/*`)

  if (releaseBranchesStdout === '') {
    return []
  }

  const releaseBranches = releaseBranchesStdout
    .split('\n')
    .map((branch) => branch.trim())
    .sort((releaseBranchA, releaseBranchB) => {
      const [, , versionA] = releaseBranchA.split('/')
      const [, , versionB] = releaseBranchB.split('/')

      return semver.compare(versionA, versionB)
    })

  return releaseBranches.reverse()
}

export async function assertWorkTreeIsClean() {
  const workTreeIsClean = unwrap(await $`git status -s`) === ''

  if (!workTreeIsClean) {
    throw new CustomError(
      "Your working tree isn't clean. Commit or stash your changes."
    );
  }
}

export async function branchExists(branch: string) {
  return !!unwrap(await $`git branch --list ${branch}`)
}

export async function assertBranchExists(branch: string) {
  if (!(await branchExists(branch))) {
    throw new CustomError(`The branch ${branch} does not exist. Check it out from the Redwood remote.`)
  }
}

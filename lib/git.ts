import semver from 'semver'
import { chalk, $ } from 'zx'

import { CustomError } from './custom_error.js'
import { unwrap } from './zx_helpers.js'

/** Gets release branches (e.g. `release/major/v7.0.0`, etc.) */
export async function getReleaseBranches() {
  const releaseBranchesStdout = unwrap(await $`git branch --list release/*`)
  if (releaseBranchesStdout === '') {
    return []
  }

  const releaseBranches = releaseBranchesStdout
    .split('\n')
    .map((branch) => branch.trim().replace('* ', ''))
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
      `The working tree at ${chalk.magenta(process.cwd())} isn't clean. Commit or stash your changes`
    );
  }
  console.log('✨ The working tree is clean')
}

export async function branchExists(branch: string) {
  return !!unwrap(await $`git branch --list ${branch}`)
}

export async function assertBranchExists(branch: string) {
  if (!(await branchExists(branch))) {
    throw new CustomError([
      `The ${chalk.magenta(branch)} branch doesn't exist locally. Check it out from the Redwood remote:`,
      '',
      chalk.green(`  git checkout -b ${branch} <your-redwood-remote>/${branch}`),
    ].join('\n'))
  }
  console.log(`🏠 The ${chalk.magenta(branch)} branch exists locally`)
}

export async function getRedwoodRemote() {
  const remotes = unwrap(await $`git remote -v`)

  for (const remote of remotes.split('\n')) {
    const match = remote.match(/^(?<remote>.+)\s.+redwoodjs\/redwood/)
    if (match?.groups) {
      console.log(`📡 Got Redwood remote ${chalk.magenta(match.groups.remote)}`)
      return match.groups.remote
    }
  }

  throw new CustomError(`Couldn't find the remote for the Redwood monorepo`)
}

export const commitRegExps = {
  hash: /(?<hash>\w{40})\s/,
  pr: /\(#(?<pr>\d+)\)$/,
  annotatedTag: /^v\d.\d.\d$/,
}

/** Get a commit's hash */
export function getCommitHash(line: string) {
  const match = line.match(commitRegExps.hash)

  if (!match?.groups) {
    throw new Error([
      `Couldn't find a commit hash in the line "${line}"`,
      "This most likely means that a line that's UI isn't being identified as such",
    ].join('\n'))
  }

  return match.groups.hash
}

/** Square brackets (`[` or `]`) in commit messages need to be escaped */
function sanitizeMessage(message: string) {
  return message.replace('[', '\\[').replace(']', '\\]')
}

export async function commitIsInRef(ref: string, message: string) {
  message = sanitizeMessage(message)
  return unwrap(await $`git log ${ref} --oneline --grep ${message}`)
}

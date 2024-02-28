import { chalk, $ } from 'zx'

import { CustomError } from './custom_error.js'
import { unwrap } from './zx_helpers.js'

export async function getRedwoodRemote() {
  const stdout = unwrap(await $`git remote -v`)
  const redwoodRemote = getRedwoodRemoteFromStdout(stdout)
  console.log(`📡 Got Redwood remote ${chalk.magenta(redwoodRemote)}`)
  return redwoodRemote
}

export function getRedwoodRemoteFromStdout(remotes: string) {
  for (const remote of remotes.split('\n')) {
    const match = remote.match(redwoodRemoteRegExp)
    if (match?.groups) {
      return match.groups.remote
    }
  }

  throw new CustomError(`Couldn't find the remote for the Redwood monorepo`)
}

export const redwoodRemoteRegExp = /^(?<remote>.+)\s.+redwoodjs\/redwood/

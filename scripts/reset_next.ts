// Don't use this unless you know what you're doing!
//
// This script resets the next branch to the ${REMOTE}/next branch.
// It's useful for testing the triage script, but it's destructive.

import { question, $ } from 'zx'

import { assertRwfwPathAndSetCwd } from '@lib/cwd.js'
import { getRedwoodRemote } from '@lib/get_redwood_remote.js'
import { resIsYes } from '@lib/prompts.js'

if (resIsYes(await question('Ok to reset next to origin/next? [Y/n] > '))) {
  await assertRwfwPathAndSetCwd()
  await $`git switch next`
  const remote = await getRedwoodRemote()
  await $`git fetch ${remote}`
  await $`git reset --hard ${remote}/next`
}

// Don't use this unless you know what you're doing!
//
// This script resets the next branch to the ${REMOTE}/next branch.
// It's useful for testing the triage script, but it's destructive.

import { question, $ } from 'zx'

import { setCwd } from '@lib/cwd.js'
import { REMOTE } from '@lib/github.js'
import { resIsYes } from '@lib/prompts.js'

if (resIsYes(await question('Ok to reset next to origin/next? [Y/n] > '))) {
  await setCwd()
  await $`git switch next`
  await $`git fetch ${REMOTE}`
  await $`git reset --hard ${REMOTE}/next`
}

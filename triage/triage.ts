/* eslint-env node */

// Checklist for manual testing:
//
// - [ ] accepts a range (`main...next`) as a a positional arg
// - [ ] throws if the range is syntactically invalid (`main..next`)
// - [ ] throws if the branches specified in the range don't exist
// - [ ] prompts if no positional arg is provided
//
// - [ ] --verbose (-v) controls verbosity
// - [ ] --verbose (-v) defaults to false
//
// - [ ] --skip-branch-check skips the branch status check

import util from 'node:util'

import { chalk } from 'zx'

import {
  branchExists,
  consoleBoxen,
  getReleaseBranches,
  prompts,
  resolveBranchStatuses,
  setVerbosity,
  setCwd,
} from '../lib/releaseLib.js'
import type { Range } from '../lib/types.js'
import { setTriageCwd, triageRange } from './triageLib.js'

async function main() {
  let options: Awaited<ReturnType<typeof parseArgs>>

  try {
    options = await parseArgs()
  } catch (e) {
    consoleBoxen('👷 Heads up', e.message)
    process.exitCode = 1
    return
  }

  const { verbose, checkBranchStatuses, range } = options

  setVerbosity(!!verbose)
  setCwd('../redwood')
  setTriageCwd('../redwood')

  // One gotcha when triaging commits: you don't have the latest branches.
  if (checkBranchStatuses) {
    const result = await resolveBranchStatuses([range.from, range.to])

    if (result.error) {
      consoleBoxen('👷 Heads up', result.error)
      process.exitCode = 1
      return
    }
  }

  // TODO: Check to make sure the redwood repo doesn't have any changed or
  // untracked files.

  try {
    await triageRange(range)
  } catch (e) {
    consoleBoxen('👷 Heads up', e.message)
    process.exitCode = 1
    return
  }
}

export async function parseArgs() {
  const { positionals, values } = util.parseArgs({
    allowPositionals: true,

    options: {
      // Seems like a limitation of `parseArgs`, but we can't specify `check-branches: { default: true }`
      // because there's no way to unset it at the CLI.
      'skip-branch-status-check': {
        type: 'boolean',
      },

      verbose: {
        type: 'boolean',
        short: 'v',
        default: false,
      },
    },
  })

  const range: Range = { to: '', from: '' }

  // We let the user provide a range (`main...next`) as a positional argument. If they don't, we prompt.
  if (positionals.length) {
    const [userProvidedRange] = positionals

    // Matches something like `main...next`.
    const rangeRegExp = /.+\.\.\..+/

    if (!rangeRegExp.test(userProvidedRange)) {
      throw new Error(
        `Error: If you provide a positional argument, it must be in the form of a range like ${chalk.magenta(
          'main...next'
        )}`
      )
    }

    const [from, to] = userProvidedRange.split('...')

    if (!(await branchExists(from))) {
      throw new Error(`The branch ${chalk.magenta(from)} doesn't exist.`)
    }
    if (!(await branchExists(to))) {
      throw new Error(`The branch ${chalk.magenta(to)} doesn't exist.`)
    }

    range.from = from
    range.to = to
  } else {
    const releaseBranches = await getReleaseBranches()

    // You should cherry pick from
    //
    // - main -> next
    // - next -> a release branch
    //
    // You shouldn't cherry pick straight from `main` to a release branch
    // because if the release branch is a patch, the minor (which is cut from `next`) will be missing that commit.
    const choices = [
      'main...next',
      ...releaseBranches.map((branch) => `next...${branch}`),
    ].map((branch) => {
      return {
        title: branch,
        value: branch,
      }
    })

    const rangeRes = await prompts({
      name: 'range',
      message: 'Which range do you want to triage?',
      type: 'select',
      choices,
    })

    const [from, to] = rangeRes.range.split('...')
    range.from = from
    range.to = to
  }

  // Spreading `values` here adds `no-check-branches-statuses`. Instead we add them by hand, specifying defaults:
  //
  // - if range isn't explicitly set, default to `main...next`
  // - if `--no-check-branches-statuses` isn't explicitly set, default to `true`.
  return {
    range,
    checkBranchStatuses: !values['skip-check-branch-check'] ?? true,
    verbose: values.verbose,
  }
}

main()

// TODO
// function getHelp() {
//   return [
//     chalk.bold('# 📥 Triage'),
//     '',
//     chalk.bold('## Usage'),
//     '',
//     chalk.green('  yarn node ./tasks/release/triage/triage.mjs [range]'),
//     '',
//     chalk.dim(
//       '  # Triage from next to a release branch like release/patch/v6.3.3'
//     ),
//     chalk.cyan(
//       '  yarn node ./tasks/release/triage/triage.mjs next...release/patch/v6.3.3'
//     ),
//     '',
//     chalk.bold('## Options'),
//     '',
//     chalk.green('--verbose'),
//     chalk.green('--skip-branch-status-check'),
//   ].join('\n')
// }

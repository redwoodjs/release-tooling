import { fileURLToPath } from 'node:url'

import { cd, chalk, fs, question, $ } from 'zx'

import { PR_MILESTONE_CACHE_PATH, TRIAGE_DATA_PATH } from '../lib/consts'
import {
  consoleBoxen,
  getSpinner,
  getSymmetricDifference,
  prMilestoneCache,
  prompts,
  reportCommitStatuses,
  resolveSymmetricDifference,
  unwrap,
} from '../lib/releaseLib'
import { CherryPickAnswer, Range } from '../lib/types'

export function setTriageCwd(cwd: string) {
  $.cwd = cwd
}

export async function triageRange(range: Range) {
  const spinner = getSpinner(
    `Getting the symmetric difference between ${chalk.magenta(
      range.from
    )} and ${chalk.magenta(range.to)}`
  )

  // Sometimes one of the `range` branches is a release branch with slashes like `release/branch/v6.3.3`.
  // Here we're just replacing the slashes with dashes so that it's a valid file name.
  const fileNamePrefix = [
    range.from.replaceAll('/', '-'),
    range.to.replaceAll('/', '-'),
  ].join('_')

  // Set up the commit triage data. This reads a file like `./main_next.commitTriageData.json` into a map
  // and sets up a hook on `process.exit` so that we don't have to remember to write it.
  //
  // The commit triage data is a map of commit hashes to triage data:
  //
  // ```js
  // 'adddd23987b8a1003053280fafe772275e932217' => {
  //   message: 'chore(deps): update dependency lerna to v7.3.0 (#9186)',
  //   needsCherryPick: false
  // }
  // ```
  let commitTriageData
  const commitTriageDataPath = new URL(
    `./${fileNamePrefix}.commitTriageData.json`,
    TRIAGE_DATA_PATH
  )

  try {
    commitTriageData = new Map(
      Object.entries(fs.readJSONSync(commitTriageDataPath, 'utf-8'))
    )
  } catch (e) {
    if (e.code === 'ENOENT') {
      commitTriageData = new Map()
    } else {
      throw e
    }
  }

  // In git, the "symmetric difference" (syntactically, three dots: `...`) is what's different between two branches.
  // It's the commits one branch has that the other doesn't, and vice versa:
  //
  // ```
  // git log main...next
  // ```
  //
  // Here we're only interested in the commits `range.from` (e.g., `main`) has that `range.to` (e.g. `next`) doesn't
  // because we're cherry picking from the former to the latter.
  //
  // `git log` by itself isn't quite enough, but there are a couple flags that get us closer to what we want:
  //
  // - `--left-only` shows us the commits unique to the ref on the left side of the three dots
  // - `--cherry-pick` omits commits that are _exactly_ the same between the branches
  //
  // It's very likely that some of the commits that are unique to the left ref have already been cherry picked into the right one.
  // The reason that the `--cherry-pick` flag doesn't omit them  is that they were changed while cherry picking
  // (think updating `yarn.lock`, etc.) so the diffs aren't one-to-one. The commit triage data and `git log --grep` get us the rest of the way there.
  const lines = await getSymmetricDifference(range)

  // Save the result for QA. (See `./triage/triageQA.mjs`.)
  await fs.writeJSON(
    new URL(
      `../triage-data/${fileNamePrefix}.symmetricDifference.json`,
      import.meta.url
    ),
    lines,
    {
      spaces: 2,
    }
  )

  spinner.text = 'Resolving the symmetric difference'
  const commits = await resolveSymmetricDifference(lines, {
    range,
  })
  spinner.stop()

  const commitsToTriage = await resolveCommitsToTriage({
    commits,
    commitTriageData,
    range,
  })

  if (commitsToTriage.length) {
    // Reversing here so that we triage commits from oldest newest. It's more natural to triage this way
    // because otherwise you'll be missing context for the newer commits.
    await triageCommits({
      commits: commitsToTriage.reverse(),
      commitTriageData,
      range,
    })
    console.log()
  }

  reportCommitStatuses({ commits, commitTriageData, range })

  if (commitTriageData.size || prMilestoneCache.size) {
    fs.writeJSONSync(
      commitTriageDataPath,
      Object.fromEntries(commitTriageData),
      {
        spaces: 2,
      }
    )
    fs.writeJSONSync(
      PR_MILESTONE_CACHE_PATH,
      Object.fromEntries(prMilestoneCache),
      {
        spaces: 2,
      }
    )

    await cd(fileURLToPath(TRIAGE_DATA_PATH))
    await $`git commit -am "triage ${new Date().toISOString()}"`
    await $`git push`
  }
}

/**
 * @param {{
 *   commits: Commit[]
 *   commitTriageData: CommitTriageData,
 *   targetBranch: string,
 * }} options
 */
export async function resolveCommitsToTriage({
  commits,
  commitTriageData,
  range,
}) {
  const logs: Array<string> = []

  const commitHashes = commits.map((commit) => commit.hash)

  // `commits` are commits from main (or another branch) that are candidates for cherry picking.
  // If the hash of one of them isn't in the commit triage data, it was cherry picked cleanly,
  // so we don't need to keep track of it anymore.
  for (const [hash] of commitTriageData) {
    if (!commitHashes.includes(hash)) {
      logs.push(
        `✨ ${chalk.cyan(
          commitTriageData.get(hash).message
        )} was cherry picked cleanly`
      )
      commitTriageData.delete(hash)
    }
  }

  // Delete those that needed to be cherry picked and have been. These ones weren't clean cherry picks.
  const needsCherryPick = new Map<string, any>(
    [...commitTriageData.entries()].filter(
      ([_hash, triageData]) => triageData.needsCherryPick
    )
  )

  for (const [hash, triageData] of needsCherryPick) {
    const { ref } = commits.find((commit) => commit.hash === hash)

    if (ref === range.to) {
      logs.push(
        `🐙 ${chalk.cyan(triageData.message)} was cherry picked with changes`
      )
      commitTriageData.delete(hash)
    }
  }

  if (logs.length) {
    consoleBoxen(
      '🧹 Purging commit triage data',
      [`Removed ${logs.length} commits:`, ...logs].join('\n')
    )
  } else {
    consoleBoxen('✅', 'The commit triage data is up to date')
  }

  // Get the commits that need triage. The logic for the filters is:
  //
  // - not every annotated commit is a commit; some are just `git log --graph` ui, so filter those out
  // - at this point, annotated commits that have a `ref` that's the same as the target branch have already been cherry picked
  // - now that the commit triage data is up to date, any annotated commits that aren't in it haven't been triaged
  return commits
    .filter((commit) => commit.type === 'commit')
    .filter((commit) => commit.ref !== range.to)
    .filter((commit) => !commitTriageData.has(commit.hash))
}

/**
 * Given an array of commit objects, ask if they need to be cherry picked and update the commit triage data in response.
 *
 * @param {{
 *   commitsToTriage: AnnotatedCommit[],
 *   commitTriageData: CommitTriageData,
 *   range: Range,
 * }} options
 */
export async function triageCommits({ commits, commitTriageData, range }) {
  consoleBoxen(
    `🐙 New commit(s)`,
    [
      [
        `There is/are ${chalk.magenta(commits.length)} commit(s)`,
        `in the ${chalk.magenta(range.from)} branch`,
        `that isn't/aren't in the ${chalk.magenta(range.to)} branch:`,
      ].join(' '),
      ...commits.map(({ hash, message }) => `• ${chalk.dim(hash)} ${message}`),
    ].join('\n')
  )

  for (const commit of commits) {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const prettyLine = [
        '  •',
        chalk.dim(commit.hash),
        chalk.cyan(commit.message),
        commit.milestone && chalk.yellow(`(${commit.milestone})`),
      ]
        .filter(Boolean)
        .join(' ')
      const prettyTo = chalk.magenta(range.to)
      const message = [
        'Does...',
        prettyLine,
        `need to be cherry picked into ${prettyTo}? [Y/n/s(kip)/o(pen)] > `,
      ].join('\n')

      let answer: CherryPickAnswer | 'open' = 'no'
      if (!['RSC', 'SSR', 'v7.0.0'].includes(commit.milestone)) {
        const result = await prompts({
          type: 'text',
          name: 'answer',
          message,
          validate: (answer) => {
            return isValidAnswer(answer) || 'Please enter a valid answer'
          },
        })
        answer = getLongAnswer(result.answer)
      }

      let comment = ''
      if (answer === 'skip') {
        const commentRes = await prompts({
          type: 'text',
          name: 'comment',
          message: 'Why are you skipping it?',

          validate: (comment) => comment.length > 0 || 'Please enter a comment',
        })

        comment = commentRes.comment
      }

      if (answer === 'open') {
        if (commit.url) {
          await $`open ${commit.url}`
        } else {
          console.log("There's no PR for this commit")
        }

        continue
      }

      // Try cherry-picking
      await $`git checkout ${range.to}`
      const cherryPickResult = await $`git cherry-pick ${commit.hash}`.nothrow()

      if (cherryPickResult.exitCode !== 0) {
        const filesWithConflicts = unwrap(
          await $`git diff --name-only --diff-filter=U`
        ).split('\n')

        // If the only file with conflicts is yarn.lock we can probably fix the
        // conflict automatically by just reinstalling
        if (
          filesWithConflicts.length === 1 &&
          filesWithConflicts[0] === 'yarn.lock'
        ) {
          handleYarnLockConflicts()
          break
        }

        // If only package.json files and yarn.lock changed, it's most likely
        // just updated package versions. Using the "combine" merge strategy
        // usually works, so let's suggest that and let the user confirm
        if (
          filesWithConflicts.every(
            (file) => file.endsWith('/package.json') || file === 'yarn.lock'
          )
        ) {
          console.log(
            'Only package.json files and yarn.lock changed. The ' +
              'script could potentially suggest the result of a "combine" ' +
              'merge. But this is not implemented yet. Please help!'
          )
          // TODO: Implement
        }
      }

      if (cherryPickResult.exitCode !== 0) {
        await question(
          'The script could not automatically fix the cherry-pick ' +
            'conflicts.\nPlease fix them manually in a separate console and ' +
            'then press any key to let the script continue with ' +
            '`git cherry-pick --continue` >'
        )

        await $`git cherry-pick --continue --no-edit`
      }

      // commitTriageData.set(commit.hash, {
      //   message: commit.message,
      //   needsCherryPick: answer,
      //   ...(comment && { comment }),
      // })

      break
    }
  }
}

async function handleYarnLockConflicts() {
  // Accept all current changes
  await $`git checkout --ours -- yarn.lock`

  // Run yarn install and make sure everything still passes check
  const yarnCheckResult =
    await $`yarn install && yarn dedupe && yarn check`.nothrow()

  if (yarnCheckResult.exitCode !== 0) {
    // Get rid of all changes and let yarn build the lock file
    await $`git checkout HEAD -- yarn.lock`

    const yarnCheckResult =
      await $`yarn install && yarn dedupe && yarn check`.nothrow()

    if (yarnCheckResult.exitCode !== 0) {
      await question(
        'The script could not automatically fix the `yarn.lock` ' +
          'conflicts.\nPlease fix them manually, and then press any key to ' +
          'let the script continue with `git cherry-pick --continue` >'
      )
    }
  }

  await $`git add yarn.lock`
  await $`git cherry-pick --continue`
}

function isValidAnswer(answer: string) {
  return ['', 'y', 'yes', 'n', 'no', 's', 'skip', 'o', 'open'].includes(
    answer.toLowerCase()
  )
}

function getLongAnswer(answer: string) {
  answer = answer.toLowerCase()

  // If the user just hits enter (i.e. answer === ''), default to yes.
  if (['', 'y', 'yes'].includes(answer)) {
    return 'yes'
  }

  if (['n', 'no'].includes(answer)) {
    return 'no'
  }

  if (['s', 'skip'].includes(answer)) {
    return 'skip'
  }

  if (['o', 'open'].includes(answer)) {
    return 'open'
  }

  throw new Error('Invalid answer: ' + answer)
}

import boxen from 'boxen'
import { Octokit } from 'octokit'
import ora from 'ora'
import promptsImport from 'prompts'
import type { Options, PromptObject } from 'prompts'
import semver from 'semver'
import { chalk, fs, path, question, $ } from 'zx'
import { ProcessOutput } from 'zx'

import 'dotenv/config'

import { PR_MILESTONE_CACHE_PATH } from './constants.js'
import { CommitTriageData, Range, TriageData } from './types.js'
import { isErrorWithCode, isErrorWithStatus } from './utils.js'

// A string of dashes that spans the width of the user's terminal terminal.
export const separator = chalk.dim('-'.repeat(process.stdout.columns))

// Set the verbosity of all the functions in this file.
export function setVerbosity(verbose: boolean) {
  $.verbose = verbose
}

// Set the verbosity of all the functions in this file.
export function setCwd(cwd: string) {
  $.cwd = cwd
}

export function getLogger() {
  return $.verbose ? console.log : () => {}
}

export function getSpinner(message: string) {
  return $.verbose
    ? {
        stop: () => {},
        text: '',
      }
    : ora(message).start()
}

/**
 * Helper for getting the trimmed stdout from `zx`'s `ProcessOutput`:
 *
 * ```js
 * unwrap(await $`git branch --list release/*`)
 * ```
 */
export function unwrap(processOutput: ProcessOutput) {
  return processOutput.stdout.trim()
}

export function consoleBoxen(title: string, message: string) {
  console.log()
  console.log(
    boxen(message, {
      title,

      backgroundColor: '#333',
      borderStyle: 'round',

      float: 'left',

      margin: { top: 0, right: 0, bottom: 0, left: 0 },
      padding: { top: 0, right: 1, bottom: 0, left: 1 },
    })
  )
}

/**
 * See if the user answered yes to `zx`'s `question`, which is just `readline`.
 *
 * ```
 * const okToRelease = isYes(await question('Ok to release?'))
 *
 * if (okToRelease) {
 *   // ...
 * }
 * ```
 */
export function isYes(res: string) {
  return ['', 'Y', 'y'].includes(res)
}

/** Wrapper around `prompts` to exit on ctrl c */
export function prompts(
  promptsObject: PromptObject,
  promptsOptions: Options = {}
) {
  return promptsImport(promptsObject, {
    ...promptsOptions,
    onCancel: () => process.exit(1),
  })
}

// ─── Branch Statuses ─────────────────────────────────────────────────────────

/**
 * Basically runs `git fetch origin` on branches with safety checks and logging.
 */
export async function resolveBranchStatuses(branches: Array<string>) {
  const spinner = getSpinner(
    `Resolving branch statuses for: ${branches
      .map((branch) => chalk.magenta(branch))
      .join(', ')}`
  )

  const logger = getLogger()

  logger(separator)
  logger(
    `Resolving statuses for: ${branches
      .map((branch) => chalk.magenta(branch))
      .join(', ')}`
  )

  let result

  // We need to run `git remote update ${redwoodRemote}` to `git fetch ${branch}`.
  // Nine out of ten times, the redwood remote is `origin`. But let's just be sure.
  result = await getRedwoodRemote()

  if (result.error) {
    return result
  }

  logger(`Found Redwood remote ${chalk.magenta(result.redwoodRemote)}`)

  await $`git remote update ${result.redwoodRemote}`

  // Get an object of branches to their commit statuses. I.e., if they're
  // ahead, behind, or diverged.
  const branchesToCommits = await getBranchesToCommits(
    branches,
    result.redwoodRemote
  )

  spinner.stop()

  result = await handleBranchesToCommits(
    branchesToCommits,
    result.redwoodRemote
  )

  return result
}

/**
 * Find the remote that points to `redwoodjs/redwood.git`.
 */
export async function getRedwoodRemote() {
  const result: any = {
    redwoodRemote: undefined,
    error: undefined,
  }

  const gitRemotes = unwrap(await $`git remote -v`).split('\n')

  result.redwoodRemote = gitRemotes.reduce<string | undefined>(
    (redwoodRemote, remote) => {
      if (redwoodRemote) {
        return redwoodRemote
      }

      const found = remote.match(
        /(?<name>\w+)\s+(git@|https:\/\/)github\.com(:|\/)redwoodjs\/redwood\.git/
      )

      if (found?.groups?.name) {
        return found.groups.name
      }
    },
    undefined
  )

  if (!result.redwoodRemote) {
    result.error =
      "Couldn't find a git remote that points to redwoodjs/redwood.git"
  }

  return result
}

interface BranchStatus {
  existsOnRedwoodRemote: boolean
  upToDate?: boolean
  diverged?: boolean
  commitsExclusiveToLocalBranch?: number
  commitsExclusiveToRemoteBranch?: number
}

/**
 * Build an object like...
 *
 * ```js
 * {
 *   main: {
 *     existsOnRedwoodRemote: true,
 *     upToDate: false,
 *     diverged: false,
 *     commitsExclusiveToLocalBranch: 0,
 *     commitsExclusiveToRemoteBranch: 4
 *   },
 *   next: ...
 * }
 * ```
 */
export async function getBranchesToCommits(
  branches: Array<string>,
  redwoodRemote: string
) {
  return branches.reduce<Promise<Record<string, BranchStatus>>>(
    async (branchesToCommitsPromise, branch) => {
      const branchesToCommits = await branchesToCommitsPromise

      if (!(await branchExistsOnRedwoodRemote(branch, redwoodRemote))) {
        branchesToCommits[branch] = { existsOnRedwoodRemote: false }
      } else {
        const commitsExclusiveToLocalBranch = +unwrap(
          await $`git rev-list ${redwoodRemote}/${branch}..${branch} --count`
        )
        const commitsExclusiveToRemoteBranch = +unwrap(
          await $`git rev-list ${branch}..${redwoodRemote}/${branch} --count`
        )

        branchesToCommits[branch] = {
          existsOnRedwoodRemote: true,
          upToDate:
            commitsExclusiveToLocalBranch === 0 &&
            commitsExclusiveToRemoteBranch === 0,
          diverged:
            commitsExclusiveToLocalBranch > 0 &&
            commitsExclusiveToRemoteBranch > 0,
          commitsExclusiveToLocalBranch,
          commitsExclusiveToRemoteBranch,
        }
      }

      return branchesToCommits
    },
    Promise.resolve({})
  )
}

export async function branchExistsOnRedwoodRemote(
  branch: string,
  redwoodRemote: string
) {
  return !!unwrap(await $`git ls-remote --heads ${redwoodRemote} ${branch}`)
}

/**
 * Logs results. Returns an error if a branch diverged. Otherwise, prompts the
 * user to update their local branches if they need to.
 */
export async function handleBranchesToCommits(
  branchesToCommits: Record<string, BranchStatus>,
  redwoodRemote: string
) {
  const result: any = {
    error: undefined,
  }

  const message = Object.entries(branchesToCommits).map(([branch, status]) => {
    if (!status.existsOnRedwoodRemote) {
      return `❓ ${chalk.magenta(
        branch
      )} doesn't exist on the Redwood remote (${redwoodRemote})`
    }

    if (status.upToDate) {
      return `✅ ${chalk.magenta(branch)} is up to date`
    }

    return [
      `🧮 ${chalk.magenta(branch)} has...`,
      `   🏠 ${status.commitsExclusiveToLocalBranch} commit(s) locally that the remote branch doesn't`,
      `   📡 ${status.commitsExclusiveToRemoteBranch} commit(s) remotely that the local branch doesn't`,
    ].join('\n')
  })

  consoleBoxen('🐙 Branch status(es)', message.join('\n'))

  const divergedGetter = ([, { diverged }]: [unknown, BranchStatus]) => diverged

  const diverged = Object.entries(branchesToCommits).some(divergedGetter)

  if (diverged) {
    const branches = Object.entries(branchesToCommits)
      .filter(divergedGetter)
      .map(([branch]) => chalk.magenta(branch))
      .join(', ')

    result.error = [
      `The following branch(es) have diverged—they have commits that are exclusive to both the local and remote: ${branches}.`,
      "Trying to triage commits right now probably isn't going to be a good time.",
    ].join('\n')
  } else {
    for (const [branch, status] of Object.entries(branchesToCommits)) {
      if (
        status.commitsExclusiveToRemoteBranch &&
        isYes(
          await question(`Ok to \`git fetch\` ${chalk.magenta(branch)}? [Y/n] `)
        )
      ) {
        await $`git fetch ${redwoodRemote} ${branch}:${branch}`
      }
    }
  }

  return result
}

// ─── Git ─────────────────────────────────────────────────────────────────────

export const defaultGitLogOptions = [
  '--oneline',
  '--no-abbrev-commit',
  '--left-right',
  '--graph',
  '--left-only',
  '--cherry-pick',
  '--boundary',
]

/**
 * Get the symmetric difference between two refs. (Basically, what's different about them.)
 * This is used to compare:
 * - main to next
 * - next to the release branch
 *
 * It doesn't really matter which ref is left and which is right.
 * The commits in the left ref will be prefixed with "<", while the commits in the right ref will be prefixed with ">".
 *
 * For a quick reference on the `...` syntax,
 * see https://stackoverflow.com/questions/462974/what-are-the-differences-between-double-dot-and-triple-dot-in-git-com.
 */
export async function getSymmetricDifference(
  range: Range,
  { gitLogOptions = undefined } = {}
) {
  return unwrap(
    await $`git log ${gitLogOptions ?? defaultGitLogOptions} ${range.from}...${
      range.to
    }`
  ).split('\n')
}

/**
 * Resolves the return of `getSymmetricDifference`. `getSymmetricDifference`
 * gets us the commits that are different between two refs, but some of those
 * commits are...
 *
 * - decorative (some lines are just UI when `--graph` is passed)
 * - virtually the same (only the `yarn.lock` has changed)
 * - aren't meant to be cherry picked
 * - etc.
 */
export async function resolveSymmetricDifference(
  lines: Array<string>,
  range: Range
) {
  const logger = getLogger()

  const refsToColorFunctions = {
    [range.to]: chalk.dim.bgBlue,
  }

  const commits = await Promise.all(
    lines.map((line) =>
      resolveLine(line, {
        range,
        refsToColorFunctions,
        logger,
      })
    )
  )

  return commits
}

export async function resolveLine(
  line: string,
  {
    range,
    refsToColorFunctions,
    logger,
  }: {
    range: Range | RangeSteps
    refsToColorFunctions: Record<string, (text: string) => string>
    logger: (...args: any[]) => void
  }
) {
  const logs: Array<string> = []

  let commit = {
    line,
    type: 'commit' as const,
    ref: range.from,
    pretty: line,
    hash: '',
    message: '',
  }

  commit = await resolveCommitType(commit, { logs })

  if (['ui', 'tag', 'release-chore'].includes(commit.type)) {
    return commit
  }

  const rangeTo = Array.isArray(range.to) ? range.to : [range.to]

  // We check refs in order from least recent to most and break once we find one.
  for (const ref of rangeTo) {
    logs.push(
      ['', `🔎 checking if commit is in ${chalk.magenta(ref)}`].join('\n')
    )

    const isInRef = unwrap(
      await $`git log ${ref} --oneline --grep ${sanitizeMessage(
        commit.message
      )}`
    )

    if (isInRef) {
      logs.push(`✅ commit is in ${chalk.magenta(ref)}`)

      commit.ref = ref
      commit.pretty = refsToColorFunctions[ref](commit.pretty)

      break
    }

    logs.push(`❌ commit isn't in ${chalk.magenta(ref)}`)
  }

  logger(
    [...logs, '', commit.pretty, JSON.stringify({ commit }, null, 2)].join('\n')
  )

  return commit
}

interface CommitLine {
  line: string
  ref: string
}

async function resolveCommitType(
  // { line, ref }: CommitLine,
  commitLine: CommitLine,
  { logs }: { logs: Array<string> }
) {
  // ): Promise<TriageData> {
  logs.push(separator)

  const commit: any = { ...commitLine }

  if (isLineGitLogUI(commit.line)) {
    commit.type = 'ui'
    commit.pretty = chalk.dim(commit.line)

    logs.push('🎄 this line is just `git log` ui')

    return commit
  }

  // Every commit has a hash so we're not bothering with optional chaining here.
  commit.hash = commit.line.match(commitRegExps.hash).groups.hash

  // TODO: explain this.
  commit.message = unwrap(await $`git log --format=%s -n 1 ${commit.hash}`)

  if (commitRegExps.annotatedTag.test(commit.message)) {
    commit.type = 'tag'
    commit.ref = commit.message
    commit.pretty = chalk.dim(commit.line)

    logs.push('🔖 this commit is an annotated tag')

    return commit
  }

  if (isCommitReleaseChore(commit.line)) {
    commit.type = 'release-chore'
    commit.pretty = chalk.dim(commit.line)

    logs.push('🧹 this commit is a release chore')

    return commit
  }

  if (commit.message.startsWith('Revert')) {
    commit.type = 'revert'
    commit.pretty = chalk.underline(commit.line)

    logs.push('↩️ this commit reverts a previous commit')

    return commit
  }

  // Not all commits are associated with a PR.
  commit.pr = commit.message.match(commitRegExps.pr)?.groups.pr

  if (!commit.pr) {
    return commit
  }

  commit.url = `https://github.com/redwoodjs/redwood/pull/${commit.pr}`

  // If we can't get a commit that has a PR's milestone, it's a bug.
  try {
    commit.milestone = await getPRMilestoneFromURL(commit.url)
  } catch (e) {
    throw new Error(
      [
        `Error: Couldn't get milestone for ${commit.line} using ${commit.url}`,
        '',
        e,
      ].join('\n')
    )
  }

  commit.line = `${commit.line} (${commit.milestone})`
  commit.pretty = commit.line

  logs.push('🔖 this commit is a pr with a milestone')

  return commit
}

/**
 * Find out if a line from `git log --graph` is just UI:
 *
 * ```
 * * 1b0b9a9 | chore: update dependencies
 * |\  # This is just UI
 * | * 3a4b5c6 (HEAD -> release/3.6, origin/release/3.6) chore: update dependencies
 * ```
 */
function isLineGitLogUI(line: string) {
  // TODO: test this fn for sure. can't i cross check against the git docs?
  const marks = ['o', ' /', '|\\', '| o', '|\\|', '|/']
  return marks.some((mark) => line.startsWith(mark))
}

const commitRegExps = {
  hash: /\s(?<hash>\w{40})\s/,
  pr: /\(#(?<pr>\d+)\)$/,
  annotatedTag: /^v\d.\d.\d$/,
}

/**
 * See if a commit is a release chore via it's message. Note that these are
 * different than PRs with the chore milestone.
 */
function isCommitReleaseChore(line: string) {
  const choreMessages = [
    'chore: update yarn.lock',
    'Version docs',
    'chore: update all contributors',
  ]

  return (
    /Merge branch (?<branch>.*)/.test(line) ||
    choreMessages.some((message) => line.includes(message))
  )
}

/**
 * Square brackets (`[` or `]`) in commit messages need to be escaped.
 */
function sanitizeMessage(message: string) {
  return message.replace('[', '\\[').replace(']', '\\]')
}

export let prMilestoneCache: Map<string, string>

export async function getPRMilestoneFromURL(prURL: string) {
  if (!prMilestoneCache) {
    try {
      prMilestoneCache = new Map(
        Object.entries(fs.readJSONSync(PR_MILESTONE_CACHE_PATH, 'utf-8'))
      )
    } catch (e) {
      if (isErrorWithCode(e) && e.code === 'ENOENT') {
        prMilestoneCache = new Map()
      } else {
        throw e
      }
    }
  }

  if (prMilestoneCache.has(prURL)) {
    return prMilestoneCache.get(prURL)
  }

  const octokit = await getOctokit()

  const {
    resource: {
      milestone: { title },
    },
  } = await octokit.graphql(getPRMilestoneFromURLQuery, { prURL })

  prMilestoneCache.set(prURL, title)

  return title
}

const getPRMilestoneFromURLQuery = `
  query GetMilestoneForCommitQuery($prURL: URI!) {
    resource(url: $prURL) {
      ...on PullRequest {
        milestone {
          title
        }
      }
    }
  }
`

interface ReportCommitStatusesOptions {
  commits: Array<TriageData>
  commitTriageData: CommitTriageData
  range: Range
}

export function reportCommitStatuses({
  commits,
  commitTriageData,
  range,
}: ReportCommitStatusesOptions) {
  // We still have to color commits based on their cherry pick status.
  // First, get the ones to color:
  const commitsToColor = commits
    .filter((commit) => commit.type === 'commit')
    .filter((commit) => commit.ref !== range.to)

  // If everything was called in order, this shouldn't happen.
  const needsTriage = commitsToColor.filter(
    (commit) => !commitTriageData.has(commit.hash)
  )

  if (needsTriage.length) {
    consoleBoxen(
      '👷 Heads up',
      [
        "At this point, there shouldn't been any commits that haven't been triaged",
        "but it looks like there's a few:",
        '',
        ...needsTriage.map((commit) => chalk.bgYellowBright(commit.line)),
      ].join('\n')
    )
  }

  for (const commit of commitsToColor) {
    const { needsCherryPick, comment } = commitTriageData.get(commit.hash) || {
      needsCherryPick: undefined,
      comment: undefined,
    }

    if (needsCherryPick === 'yes') {
      commit.pretty = chalk.green(commit.line)
    } else if (needsCherryPick === 'no') {
      commit.pretty = chalk.red(commit.line)
    } else {
      commit.pretty = [chalk.yellow(commit.line), `  ${comment}`].join('\n')
    }

    commit.needsCherryPick = needsCherryPick
  }

  const prettyTo = chalk.magenta(range.to)
  consoleBoxen(
    '🔑 Key',
    [
      `${chalk.green('■')} Needs to be cherry picked into ${prettyTo}`,
      `${chalk.yellow('■')} Skipped (see comments for details)`,
      $.verbose &&
        `${chalk.blue('■')} Was cherry picked into ${prettyTo} with changes`,
      $.verbose &&
        `${chalk.dim.red('■')} Shouldn't be cherry picked into ${prettyTo}`,
      $.verbose && `${chalk.dim('■')} Chore commit or purely-decorative line`,
    ]
      .filter(Boolean)
      .join('\n')
  )
  console.log()
  console.log(
    commits
      .filter(
        (commit) =>
          $.verbose || ['yes', 'skip'].includes(commit.needsCherryPick || 'no')
      )
      .map(({ pretty }) => pretty)
      .join('\n')
  )
}

interface RangeSteps {
  from: string
  to: string[]
}

/**
 * Gets the latest release. Uses the "-" prefix of `git tag`'s `--sort` option. See https://git-scm.com/docs/git-tag#Documentation/git-tag.txt---sortltkeygt
 */
export async function getLatestRelease() {
  return unwrap(
    await $`git tag --sort="-version:refname" --list "v?.?.?" | head -n 1`
  )
}

/**
 * Gets releases branches (e.g. `release/major/v7.0.0`, `release/minor/v6.4.0`, `release/patch/v6.3.2`, etc.)
 */
export async function getReleaseBranches() {
  const releaseBranchesStr = unwrap(await $`git branch --list release/*`)

  if (releaseBranchesStr === '') {
    return []
  }

  const releaseBranches = releaseBranchesStr
    .split('\n')
    .map((branch) => branch.trim())
    .sort((releaseBranchA, releaseBranchB) => {
      const [, , versionA] = releaseBranchA.split('/')
      const [, , versionB] = releaseBranchB.split('/')

      return semver.compare(versionA, versionB)
    })

  return releaseBranches.reverse()
}

export async function branchExists(branch: string) {
  return !!unwrap(await $`git branch --list ${branch}`)
}

// ─── Github ──────────────────────────────────────────────────────────────────

// TODO: type this
let octokit: any

export async function getOctokit() {
  if (octokit) {
    return octokit
  }

  if (process.env.GITHUB_TOKEN === undefined) {
    throw new Error(
      [
        `You have to set the ${chalk.magenta(
          'GITHUB_TOKEN'
        )} env var to a personal access token.`,
        `Create a personal access token with the ${chalk.magenta(
          'repo'
        )} scope here: https://github.com/settings/tokens.`,
      ].join('\n')
    )
  }

  octokit = new Octokit({ auth: process.env.GITHUB_TOKEN })

  try {
    await octokit.graphql(`{ viewer { login } }`)
  } catch (e) {
    if (isErrorWithStatus(e) && e.status === 401) {
      throw new Error(
        `The ${chalk.magenta(
          'GITHUB_TOKEN'
        )} env var is set, but using it in a test query returned a 401. It may have expired`
      )
    }

    throw e
  }

  return octokit
}

interface Milestone {
  title: string
  id: string
  number: number
}

export async function getMilestones(): Promise<Array<Milestone>> {
  const octokit = await getOctokit()

  const {
    repository: {
      milestones: { nodes },
    },
  } = await octokit.graphql(`
      {
        repository(owner: "redwoodjs", name: "redwood") {
          milestones(first: 100, states: OPEN) {
            nodes {
              title
              id
              number
            }
          }
        }
      }
    `)

  return nodes
}

// TODO: this needs to be recursive.
export async function getPRsWithMilestone(milestoneTitle: string) {
  const milestone = (await getMilestones()).find(
    (milestone) => milestone.title === milestoneTitle
  )

  if (!milestone) {
    throw new Error(`No milestone found with title "${milestoneTitle}"`)
  }

  const octokit = await getOctokit()

  const {
    node: {
      pullRequests: { nodes },
    },
  } = await octokit.graphql(
    `
        query ($milestoneId: ID!) {
          node(id: $milestoneId) {
            ... on Milestone {
              pullRequests(first: 100, states: MERGED) {
                nodes {
                  id
                  mergedAt

                  labels(first: 10) {
                    nodes {
                      name
                    }
                  }

                  title
                  number
                  author {
                    login
                  }

                  body
                }
              }
            }
          }
        }
      `,
    {
      milestoneId: milestone.id,
    }
  )

  return nodes
}

export async function openCherryPickPRs() {
  await $`open https://github.com/redwoodjs/redwood/pulls?q=is%3Apr+is%3Aopen+label%3Acherry-pick`
}

import { fileURLToPath } from 'node:url'

import { fs, $ } from "zx";

import { commitRegExps, commitIsInRef, getCommitHash } from '@lib/git.js'
import { gqlGitHub } from '@lib/github.js'
import type { Commit, Range } from "@lib/types.js";
import { unwrap } from "@lib/zx_helpers.js";

import { colors } from './colors.js'

export const defaultGitLogOptions = [
  "--oneline",
  "--no-abbrev-commit",
  "--left-right",
  "--graph",
  "--left-only",
  "--cherry-pick",
  "--boundary",
];

interface GetSymmetricDifferenceOptions {
  gitLogOptions?: string[];
}

/* Get the symmetric difference between two refs. (Basically, what's different about them.) */
export async function getSymmetricDifference(
  range: Range,
  { gitLogOptions }: GetSymmetricDifferenceOptions = {},
) {
  gitLogOptions ??= defaultGitLogOptions;

  return unwrap(
    await $`git log ${gitLogOptions} ${range.from}...${range.to}`,
  ).split("\n")
}

/** Resolves the return of `getSymmetricDifference` */
export async function resolveSymmetricDifference(
  lines: string[],
  { range }: { range: Range },
) {
  const commits = await Promise.all(
    lines.map((line) => resolveLine(line, { range }))
  )
  return commits
}

export const PADDING = 130

export async function resolveLine(line: string, { range }: { range: Range }) {
  const commit: Commit = {
    line,
    type: "commit",
    ref: range.from,
  };

  if (lineIsGitLogUi(commit.line)) {
    commit.type = "ui";
    return commit
  }

  commit.hash = getCommitHash(commit.line)
  commit.message = await getCommitMessage(commit.hash)

  if (lineIsAnnotatedTag(commit.message)) {
    commit.type = 'tag'
    commit.ref = commit.message
    return commit
  }

  if (lineIsChore(line)) {
    commit.type = 'chore'
    return commit
  }

  if (await commitIsInRef(range.to, commit.message)) {
    commit.ref = range.to
  }
  commit.notes = await getCommitNotes(commit.hash)

  commit.pr = getCommitPr(commit.message)
  if (!commit.pr) {
    return commit
  }
  commit.url = `https://github.com/redwoodjs/redwood/pull/${commit.pr}`
  commit.milestone = await getCommitMilestone(commit.url)
  commit.line = [commit.line.padEnd(PADDING), `(${commit.milestone})`].join(' ')

  return commit
}

/** Get a commit's message from its 40-character hash */
export async function getCommitMessage(hash: string) {
  return unwrap(await $`git log --format=%s -n 1 ${hash}`)
}

/** Get a commit's PR (if it has one) */
export function getCommitPr(message: string) {
  return message.match(commitRegExps.pr)?.groups?.pr
}

let cache: Map<string, string>

async function setUpCache() {
  const cacheFilePath = fileURLToPath(new URL('commit_milestone_cache.json', import.meta.url))

  if (!await fs.pathExists(cacheFilePath)) {
    return new Map<string, string>()
  }

  const commitMilestoneCache = await fs.readJson(cacheFilePath)
  return new Map<string, string>(Object.entries(commitMilestoneCache))

  process.on('exit', () => {
    fs.writeJsonSync(cacheFilePath, Object.fromEntries(cache))
  })
}

const query = `\
  query GetCommitMilestone($prUrl: URI!) {
    resource(url: $prUrl) {
      ...on PullRequest {
        milestone {
          title
        }
      }
    }
  }
`

/** Get a commit that has a PR's milestone */
export async function getCommitMilestone(prUrl: string) {
  if (!cache) {
    cache = await setUpCache()
  }
  if (cache.has(prUrl)) {
    return cache.get(prUrl)
  }
  const { data } = await gqlGitHub({ query, variables: { prUrl } })

  const milestone = data.resource.milestone.title
  cache.set(prUrl, milestone)
  return milestone
}

const MARKS = ["o", "/", "|\\", "| o", "|\\|", "|/"];

/** Determine if a line from `git log --graph` is just UI */
export function lineIsGitLogUi(line: string) {
  for (const mark of MARKS) {
    if (line.trim().startsWith(mark)) {
      return true;
    }
  }

  return false;
}

export function lineIsAnnotatedTag(message: string) {
  return commitRegExps.annotatedTag.test(message)
}

/** Determine if a line from `git log` is a chore commit */
export function lineIsChore(line: string) {
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

export function getPrettyLine(commit: Commit, { range }: { range: Range }) {
  if (
    commit.type === 'ui' ||
    commit.type === 'tag' ||
    commit.type === 'chore'
    ) {
    return colors.choreOrDecorative(commit.line)
  }

  if (commit.ref === range.to) {
    return colors.wasCherryPickedWithChanges(commit.line)
  }

  if (!!commit.notes || commit.milestone === 'SSR' || commit.milestone === 'RSC') {
    return colors.shouldntBeCherryPicked(commit.line)
  }

  return commit.line
}

async function getCommitNotes(hash: string) {
  try {
    const notes = unwrap(await $`git notes show ${hash}`)
    return notes
  } catch (error) {
    return undefined
  }
}

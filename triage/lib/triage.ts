import { fileURLToPath } from 'node:url'

import { chalk, fs, path, question, $ } from 'zx'

import { consoleBoxen } from '@lib/boxen.js'
import { getUserLogin, pushBranch, pushNotes } from '@lib/github.js'
import { resIsYes, resolveRes } from '@lib/prompts.js'
import { unwrap } from '@lib/zx_helpers.js'

import { getPrettyLine, getSymmetricDifference, resolveSymmetricDifference } from './symmetric_difference.js'
import { colors, separator } from './tokens.js'
import type { Commit, PrettyCommit, Range } from './types.js'

export async function triageRange(range: Range, { remote }: { remote: string }) {
  const key = await cache.getKey(range)
  let commits = await cache.get(key)

  if (!commits) {
    const symmetricDifference = await getSymmetricDifference(range)
    commits = await resolveSymmetricDifference(symmetricDifference, { range })
    commits = commits.map(commit => {
      return {
        ...commit,
        pretty: getPrettyLine(commit, { range })
      }
    })
    await cache.set(key, commits)
  }

  console.log(separator)
  reportCommits(commits, { range })
  const commitsEligibleForCherryPick = commits.filter((commit) => commitIsEligibleForCherryPick(commit, { range }))
  console.log(separator)
  if (!commitsEligibleForCherryPick.length) {
    console.log('✨ No commits to triage')
    return
  }

  reportCommitsEligibleForCherryPick(commitsEligibleForCherryPick, { range })
  console.log(separator)
  await cherryPickCommits(commitsEligibleForCherryPick.toReversed(), { range })

  console.log(separator)
  const okToPushNotes = resIsYes(await question('Ok to push notes? [Y/n/o(pen)] > '))
  if (okToPushNotes) {
    await pushNotes(remote)
  }
  const okToPushBranch = resIsYes(await question(`Ok to push ${range.to}? [Y/n/o(pen)] > `))
  if (okToPushBranch) {
    await pushBranch(range.to, remote)
  }
}

const CACHE_DIR_PATH = fileURLToPath(new URL('cache/', import.meta.url))

export const cache = {
  async getKey(range: Range) {
    const fromHash = unwrap(await $`git rev-parse --short ${range.from}`)
    const toHash = unwrap(await $`git rev-parse --short ${range.to}`)

    const cacheKey = [
      range.from,
      fromHash,
      range.to,
      toHash
    ].join('_')

    return cacheKey
  },

  async has(key: string) {
    const cacheExists = await fs.pathExists(`${path.join(CACHE_DIR_PATH, key)}.json`)
    return cacheExists
  },
  async get(key: string): Promise<PrettyCommit[] | null> {
    if (!await this.has(key)) {
      return null
    }
    const cache = await fs.readJson(`${path.join(CACHE_DIR_PATH, key)}.json`)
    return cache
  },
  async set(key: string, commits: PrettyCommit[]) {
    await fs.ensureDir(CACHE_DIR_PATH)
    await fs.writeJson(`${path.join(CACHE_DIR_PATH, key)}.json`, commits, { spaces: 2 })
  }
}

function reportCommits(commits: PrettyCommit[], { range }: { range: Range }) {
  consoleBoxen(
    '🔑 Key',
    [
      `■ Needs to be cherry picked into ${chalk.magenta(range.to)}`,
      `${colors.wasCherryPickedWithChanges('■')} Was cherry picked into ${chalk.magenta(range.to)} with changes`,
      `${colors.shouldntBeCherryPicked('■')} Shouldn't be cherry picked into ${chalk.magenta(range.to)}`,
      `${colors.choreOrDecorative('■')} Chore commit, annotated tag, or decorative line`,
    ].join('\n')
  )
  console.log()
  const prettySymDiff = commits.map(commit => commit.pretty).join('\n')
  console.log(prettySymDiff)
}

export function commitIsEligibleForCherryPick(commit: Commit, { range }: { range: Range }) {
  if (commit.type !== 'commit') {
    return false
  }
  if (commit.ref === range.to) {
    return false
  }
  if (!!commit.notes) {
    return false
  }
  if (commit.milestone === 'SSR' || commit.milestone === 'RSC') {
    return false
  }

  return true
}

function reportCommitsEligibleForCherryPick(commits: Commit[], { range }: { range: Range }) {
  consoleBoxen(`🧮 ${commits.length} commits to triage`, commits.map(commit => commit.line).join('\n'))
}

async function cherryPickCommits(commits: Commit[], { range }: { range: Range }) {
  const login = await getUserLogin()

  for (let i = 0; i < commits.length; i++) {
    const commit = commits[i]
    consoleBoxen(`🧮 Triaging ${i + 1} of ${commits.length}`, commit.line)

    while (true) {
      const res = resolveRes(await question('Ok to cherry pick? [Y/n/o(pen)] > '))

      if (res === 'open') {
        if (commit.url) {
          await $`open ${commit.url}`
        } else {
          console.log("There's no PR associated with this commit")
        }
        continue
      } else if (res === 'no') {
        let res = await question('Add a note explaining why not > ')
        res = `(${login}) ${res}`
        await $`git notes add -m ${res} ${commit.hash}`
        await $`git notes show ${commit.hash}`
        console.log(`You can edit the note with \`git notes edit ${commit.hash}\``)
        break
      }

      try {
        await $`git switch ${range.to}`
        await $`git cherry-pick ${commit.hash}`
        console.log()
        console.log(chalk.green('🌸 Successfully cherry picked'))
        break
      } catch (error) {
        console.log()
        console.log(chalk.yellow("✋ Couldn't cleanly cherry pick. Resolve the conflicts and run `git cherry-pick --continue`"))
        await question('Press anything to continue > ')
        break
      }
    }

    console.log()
  }

  consoleBoxen('🏁 Finish!', `All ${commits.length} commits have been triaged`)
}

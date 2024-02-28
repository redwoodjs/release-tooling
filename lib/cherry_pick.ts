import { chalk, question, $ } from 'zx'

import { consoleBoxen } from './console_helpers.js'
import { getUserLogin } from './github.js'
import { resolveRes } from './prompts.js'
import type { Commit, Range } from './types.js'

export async function cherryPickCommits(commits: Commit[], {
  range,
  afterCherryPick,
}: {
  range: Range
  afterCherryPick?: (commit: Commit) => Promise<void>
}) {
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
        await afterCherryPick?.(commit)
        break
      } catch (error) {
        console.log()
        console.log(chalk.yellow("✋ Couldn't cleanly cherry pick. Resolve the conflicts and run `git cherry-pick --continue`"))
        await question('Press anything to continue > ')
        await afterCherryPick?.(commit)
        break
      }
    }

    console.log()
  }

  consoleBoxen('🏁 Finish!', `All ${commits.length} commits have been triaged`)
}

export function reportCommitsEligibleForCherryPick(commits: Commit[]) {
  consoleBoxen(`🧮 ${commits.length} commits to triage`, commits.map(commit => commit.line).join('\n'))
}

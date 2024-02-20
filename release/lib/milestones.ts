import { $ } from 'zx'

import { CustomError } from '@lib/error.js'
import { gqlGitHub } from '@lib/github.js'
import { debugLogger } from '@lib/debug_logger.js'
// import { unwrap } from '@lib/zx_helpers.js'

import { PR } from './types.js'

export async function getPrsWithMilestone(milestone?: string): Promise<PR[]> {
  const search = [
    'repo:redwoodjs/redwood',
    'is:pr',
    'is:merged',
  ]
  if (!milestone) {
    search.push('no:milestone')
  } else {
    search.push(`milestone:${milestone}`)
  }
  debugLogger(search.join(' '))

  const res = await gqlGitHub({ query: prsQuery, variables: { search: search.join(' ') } })
  debugLogger(res)
  return res.data.search.nodes
}

const prsQuery = `\
  query ($search: String!) {
    search(
      query: $search
      first: 100
      type: ISSUE
    ) {
      nodes {
        ... on PullRequest {
          id
          number
          title
          url
          mergeCommit {
            messageHeadline
          }
        }
      }
    }
  }
`

export async function assertNoNoMilestonePrs() {
  const noMilestonePrs = await getPrsWithMilestone()

  if (noMilestonePrs.length > 0) {
    throw new CustomError([
      `Some PRs have been merged without a milestone`,
      ...noMilestonePrs.map((pr) => `• ${pr.url}`)
    ].join('\n'))
  }
}

// export async function getPrs({ desiredSemver }: ReleaseOptions) {
//   // Handle PRs that have been merged without a milestone. We have a check in CI for this, so it really shouldn't happen.
//   // But if it does, we handle it here.
//   let prs = await getPrsWithMilestone('next-release-patch')

//   if (desiredSemver === 'minor') {
//     const nextReleasePrs = await getPrsWithMilestone('next-release')
//     prs = [
//       ...prs,
//       ...nextReleasePrs
//     ]
//   }

//   prs.map(async (pr) => {
//     return {
//       ...pr,
//       hash: await getHashForPr(pr)
//     }
//   })

//   return prs
// }

// /** Square brackets (`[` or `]`) in commit messages need to be escaped */
// function sanitizeMessage(message: string) {
//   return message.replace('[', '\\[').replace(']', '\\]')
// }

// async function getHashForPr(message: string) {
//   message = sanitizeMessage(message)
//   const res = unwrap(await $`git log next --oneline --grep ${message}`)
// }

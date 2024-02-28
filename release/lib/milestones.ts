import { CustomError } from '@lib/custom_error.js'
import { getGitHubFetchHeaders, gqlGitHub } from '@lib/github.js'

import type { PR } from './types.js'

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

  const res = await gqlGitHub({ query: prsQuery, variables: { search: search.join(' ') } })
  const prs = res.data.search.nodes

  prs.sort((a, b) => {
    return new Date(a.mergedAt) > new Date(b.mergedAt) ? 1 : -1
  })

  return prs
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
          mergedAt
        }
      }
    }
  }
`

const milestonesToIds = {
  'chore': 'MDk6TWlsZXN0b25lNjc4MjU1MA==',
  'next-release': 'MI_kwDOC2M2f84Aa82f',
  'next-release-patch': 'MDk6TWlsZXN0b25lNjc1Nzk0MQ==',
}

export async function assertNoNoMilestonePrs() {
  const noMilestonePrs = await getPrsWithMilestone()

  if (noMilestonePrs.length > 0) {
    throw new CustomError([
      `Some PRs have been merged without a milestone`,
      ...noMilestonePrs.map((pr) => `• ${pr.url}`)
    ].join('\n'))
  }
}

export async function updatePrMilestone(prId: string, milestoneId: string) {
  return gqlGitHub({
    query: updatePrMilestoneMutation,
    variables: {
      prId,
      milestoneId: milestoneId,
    },
  })
}

const updatePrMilestoneMutation = `\
  mutation ($prId: ID!, $milestoneId: ID) {
    updatePullRequest(input: { pullRequestId: $prId, milestoneId: $milestoneId }) {
      clientMutationId
    }
  }
`

export async function createMilestone(title: string) {
  const headers = await getGitHubFetchHeaders()
  const res = await fetch(`https://api.github.com/repos/redwoodjs/redwood/milestones`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ title }),
  })
  const json = await res.json()
  return {
    id: json.node_id,
    title: json.title,
    number: json.number,
  }
}

export async function closeMilestone(title: string) {
  const milestone = await getMilestone(title)
  const headers = await getGitHubFetchHeaders()
  const res = await fetch(`https://api.github.com/repos/redwoodjs/redwood/milestones/${milestone.number}`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ state: 'closed' }),
  })
  const json = await res.json()
  console.log(json)
}

async function getMilestones() {
  const res = await gqlGitHub({ query: getMilestonesQuery })
  return res.data.repository.milestones.nodes
}

const getMilestonesQuery = `\
  {
    repository(owner: "redwoodjs", name: "redwood") {
      milestones(first: 100, states: OPEN) {
        nodes {
          id
          title
          number
        }
      }
    }
  }
`

export async function getMilestone(title: string) {
  const milestones = await getMilestones()
  let milestone = milestones.find((milestone) => milestone.title === title)
  if (milestone) {
    return milestone
  } 

  milestone = await createMilestone(title)
  return milestone
}

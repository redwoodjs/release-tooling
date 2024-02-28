import { describe, expect, test } from 'vitest'

import { getPrsWithMilestone } from './milestones.js'

describe('getPrsWithMilestone', () => {
  test('it works', async () => {
    const prs = await getPrsWithMilestone('v7.0.3')
    expect(prs).toMatchInlineSnapshot(`
      [
        {
          "id": "PR_kwDOC2M2f85nkDDh",
          "mergeCommit": {
            "messageHeadline": "Update MetaTags to be MetaData in Docs (#10053)",
          },
          "mergedAt": "2024-02-22T17:44:49Z",
          "number": 10053,
          "title": "Update MetaTags to be Metadata in Docs",
          "url": "https://github.com/redwoodjs/redwood/pull/10053",
        },
        {
          "id": "PR_kwDOC2M2f85nszPR",
          "mergeCommit": {
            "messageHeadline": "fix(render): reduce memory and handle server file  (#10055)",
          },
          "mergedAt": "2024-02-23T10:04:32Z",
          "number": 10055,
          "title": "fix(render): reduce memory and handle server file ",
          "url": "https://github.com/redwoodjs/redwood/pull/10055",
        },
        {
          "id": "PR_kwDOC2M2f85nyT1x",
          "mergeCommit": {
            "messageHeadline": "Update studio.md (#10062)",
          },
          "mergedAt": "2024-02-24T01:21:51Z",
          "number": 10062,
          "title": "Update studio.md",
          "url": "https://github.com/redwoodjs/redwood/pull/10062",
        },
      ]
    `)
  })
})

import { describe, expect, it, test } from 'vitest'

import { getCommitHash, getCommitMessage, getCommitNotes, getCommitPr } from './commits.js'

describe('getCommitHash', () => {
  it('works', () => {
    const hash = getCommitHash("< 487548234b49bb93bb79ad89c7ac4a91ed6c0dc9 chore(deps): update dependency @playwright/test to v1.41.2 (#10040)")
    expect(hash).toEqual('487548234b49bb93bb79ad89c7ac4a91ed6c0dc9')
  })

  it('throws if no hash is found', () => {
    expect(() => getCommitHash("|\\")).toThrowErrorMatchingInlineSnapshot(`
      [Error: Couldn't find a commit hash in the line "|\\"
      This most likely means that a line that's UI isn't being identified as such]
    `)
  })

  it('works for non left-right lines', () => {
    const hash = getCommitHash("487548234b49bb93bb79ad89c7ac4a91ed6c0dc9 chore(deps): update dependency @playwright/test to v1.41.2 (#10040)")
    expect(hash).toEqual('487548234b49bb93bb79ad89c7ac4a91ed6c0dc9')

  })
})

test('getCommitMessage', async () => {
  const message = await getCommitMessage('4f4ad5989b794ddd0065d9c96c3091343c2a63c0')
  expect(message).toEqual('Initial commit')
})

describe('getCommitNotes', () => {
  it('works', async () => {
    const notes = await getCommitNotes('4f4ad5989b794ddd0065d9c96c3091343c2a63c0')
    expect(notes).toEqual('(jtoar) hello')
  })

  it("returns `undefined` there's no notes", async () => {
    const notes = await getCommitNotes('9fd38ae1b3ad6afc5b0c1b2acb627b2bed25abda')
    expect(notes).toBeUndefined()
  })
})

describe('getCommitPr', () => {
  it('works', () => {
    expect(getCommitPr("< 487548234b49bb93bb79ad89c7ac4a91ed6c0dc9 chore(deps): update dependency @playwright/test to v1.41.2 (#10040)")).toEqual('10040')
  })

  it('works for reverts', () => {
    expect(getCommitPr("< 5f89c0176f517b894cb2c3f1ab9cee4c7c207393 Revert \"Revert `@testing-library/jest-dom` v6 upgrade (#9713)\" (#9719)")).toEqual('9719')
  })

  it("returns `undefined` if it can't find a PR", () => {
    expect(getCommitPr("<   635d6dea677b28993661a2e46659ff8c987b7275 Merge branch 'release/major/v7.0.0'")).toBeUndefined()
  })
})

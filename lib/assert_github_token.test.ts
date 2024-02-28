import { describe, expect, it } from 'vitest'

import { assertGitHubToken } from './assert_github_token.js'

describe('assertGitHubToken', () => {
  it('works', () => {
    expect(process.env.REDWOOD_GITHUB_TOKEN).toBeDefined()
    expect(assertGitHubToken).not.toThrow()
  })

  it("throws if `REDWOOD_GITHUB_TOKEN` isn't defined", () => {
    const originalToken = process.env.REDWOOD_GITHUB_TOKEN
    delete process.env.REDWOOD_GITHUB_TOKEN
    expect(process.env.REDWOOD_GITHUB_TOKEN).toBeUndefined()
    expect(assertGitHubToken).toThrow()
    process.env.REDWOOD_GITHUB_TOKEN = originalToken
  })
})

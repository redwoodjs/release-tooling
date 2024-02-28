import { describe, expect, it } from 'vitest'

import { getRedwoodRemoteFromStdout } from './get_redwood_remote.js'

describe('getRedwoodRemote', () => {
  it('works', () => {
    const remotes = 'origin	git@github.com:redwoodjs/redwood.git (fetch)\norigin	git@github.com:redwoodjs/redwood.git (push)'
    const redwoodRemote = getRedwoodRemoteFromStdout(remotes)
    expect(redwoodRemote).toEqual('origin')
  })

  it("throws if it can't find the redwood remote", () => {
    const remotes = 'origin	git@github.com:bazinga/bazinga.git (fetch)\norigin	git@github.com:bazinga/bazinga.git (push)'
    expect(() => {
      getRedwoodRemoteFromStdout(remotes)
    }).toThrowErrorMatchingInlineSnapshot(`[CustomError: Couldn't find the remote for the Redwood monorepo]`)
  })
})

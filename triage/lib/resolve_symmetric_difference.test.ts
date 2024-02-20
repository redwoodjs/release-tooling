import { fs, $ } from 'zx'

import { beforeAll, afterAll, describe, expect, it } from 'vitest'

import { setCwd } from '../../lib/cwd.js'
import { resolveSymmetricDifference } from './symmetric_difference.js'

$.verbose = false

describe('resolveSymmetricDifference', () => {
  let resetCwd: () => void
  beforeAll(() => {
    resetCwd = setCwd()
  })
  afterAll(() => {
    resetCwd()
  })

  it('works', async () => {
    const lines = await fs.readJson(new URL('main_next.sym_diff.json', import.meta.url))
    const commits = await resolveSymmetricDifference(lines, { range: { from: 'main', to: 'next' } })
    expect(commits).toMatchSnapshot()
  }, 40_000)
})

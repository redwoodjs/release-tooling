import { assertRwfwPathAndSetCwd } from './lib/cwd.js'
import { mergeReleaseBranch } from './release/lib/release.js'

await assertRwfwPathAndSetCwd()
await mergeReleaseBranch({
  releaseBranch: 'release/patch/v7.0.4',
  remote: 'origin',
})

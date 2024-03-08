import { assertRwfwPathAndSetCwd } from '@lib/cwd.js'

import { fs, path } from 'zx'

async function main() {
  await assertRwfwPathAndSetCwd()

  const changesets = await getChangesets()
  console.log(changesets)
}

await main()

async function getChangesets() {
  const dir = await fs.readdir('.changesets')
  return dir.map((dirent) => path.join(process.cwd(), '.changesets', dirent))
}

async function removeChangeset(path: string) {
  await fs.remove(path)
}

async function aggregateChangesets

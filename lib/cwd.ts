import { cd, fs } from "zx"

import  { CustomError } from './error.js'

export async function setCwd() {
  let RWFW_PATH = process.env.RWFW_PATH;

  if (!RWFW_PATH) {
    throw new CustomError("`RWFW_PATH` isn't set. Set it to the path of the Redwood monorepo.");
  }

  try {
    RWFW_PATH = await fs.realpath(RWFW_PATH)
  } catch (error) {
    throw new CustomError(`\`RWFW_PATH\` is set to "${RWFW_PATH}" but it doesn't exist at that path.`)
  }

  const originalCwd = process.cwd()
  cd(RWFW_PATH)
  return () => cd(originalCwd)
}

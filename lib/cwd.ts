import { cd } from "zx"

import  { CustomError } from './error.js'

export function setCwd() {
  const RWFW_PATH = process.env.RWFW_PATH;

  if (!RWFW_PATH) {
    throw new CustomError("RWFW_PATH isn't set. Set it to the path of the Redwood monorepo.");
  }

  const originalCwd = process.cwd()
  cd(RWFW_PATH)
  return () => cd(originalCwd)
}

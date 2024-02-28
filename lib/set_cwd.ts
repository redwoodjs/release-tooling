import { cd, chalk, fs } from "zx"

import { CustomError } from './custom_error.js'

export async function setCwd() {
  let RWFW_PATH = process.env.RWFW_PATH;

  if (!RWFW_PATH) {
    throw new CustomError([
      `The ${chalk.magenta('RWFW_PATH')} environment variable isn't set. Set it to the path of the Redwood monorepo:`,
      '',
      `  ${chalk.green("export RWFW_PATH='/path/to/redwoodjs/redwood'")}`,
      '',
      `in one of your shell start-up files (e.g. ${chalk.magenta('~/.bashrc')} or ${chalk.magenta('~/.zshrc')})`,
    ].join('\n'));
  }
  try {
    RWFW_PATH = await fs.realpath(RWFW_PATH)
  } catch (error) {
    throw new CustomError([
      `The ${chalk.magenta('RWFW_PATH')} environment variable is set to...`,
      '',
      `  ${chalk.magenta(RWFW_PATH)}`,
      '',
      "but there's nothing at that path"
    ].join('\n'))
  }

  const originalCwd = process.cwd()
  cd(RWFW_PATH)
  console.log(`📂 Working in ${chalk.magenta(RWFW_PATH)}`)
  return () => cd(originalCwd)
}

import { chalk } from 'zx'

import { CustomError } from './custom_error.js'

export function assertGitHubToken() {
  if (process.env.REDWOOD_GITHUB_TOKEN) {
    return
  }

  throw new CustomError([
    `The ${chalk.magenta('REDWOOD_GITHUB_TOKEN')} environment variable isn't set. Set it to a GitHub personal access token:`,
    '',
    `  ${chalk.green("export REDWOOD_GITHUB_TOKEN='...'")}`,
    '',
    `in one of your shell start-up files (e.g. ${chalk.magenta('~/.bashrc')} or ${chalk.magenta('~/.zshrc')})`,
    'or in a .env file in this directory that you create.',
    '',
    `You can create a new personal access token at https://github.com/settings/tokens`,
    `All it needs is the ${chalk.magenta('public_repo')} scope`
  ].join('\n'))
}

import { chalk } from 'zx'

export const colors = {
  wasCherryPickedWithChanges: chalk.dim.blue,
  shouldntBeCherryPicked: chalk.dim.red,
  choreOrDecorative: chalk.dim,
}

export const separator = chalk.dim('-'.repeat(process.stdout.columns))

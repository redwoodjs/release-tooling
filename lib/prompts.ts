import promptsModule from 'prompts'
import type { Options, PromptObject } from 'prompts'

/** Wrapper around `prompts` to exit on Ctrl + C */
export function prompts(
  promptsObject: PromptObject,
  promptsOptions: Options = {}
) {
  return promptsModule(promptsObject, {
    ...promptsOptions,
    onCancel: () => process.exit(1),
  })
}

export function resolveRes(res: string) {
  const isYes = resIsYes(res)

  if (isYes) {
    return 'yes'
  }

  const isOpen = resIsOpen(res)
  if (isOpen) {
    return 'open'
  }

  return 'no'
}

export function resIsYes(res: string) {
  res = res.toLocaleLowerCase()
  return res === 'yes' || res === 'y' || res === ''
}

export function resIsOpen(res: string) {
  res = res.toLocaleLowerCase()
  return res === 'open' || res === 'o'
}

export async function getDesiredSemver() {
  const choices = ['major', 'minor', 'patch']

  const res = await prompts({
    name: 'semver',
    message: 'Which semver do you want to release?',
    type: 'select',
    choices: choices.map((choice) => ({ title: choice, value: choice })),
    // Set to 'patch' because that's the most common.
    initial: 2,
  })

  return res.semver
}

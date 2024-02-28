import { $ } from 'zx'

import { unwrap } from './zx_helpers.js'

/** Square brackets (`[` or `]`) in commit messages need to be escaped */
function sanitizeMessage(message: string) {
  return message.replace('[', '\\[').replace(']', '\\]')
}

/** See if a commit has been cherry picked into a given ref */
export async function commitIsInRef(ref: string, message: string) {
  message = sanitizeMessage(message)
  return unwrap(await $`git log ${ref} --oneline --grep ${message}`)
}

export const commitRegExps = {
  hash: /(?<hash>\w{40})\s/,
  pr: /\(#(?<pr>\d+)\)$/,
  annotatedTag: /^v\d.\d.\d$/,
}

/** Get a commit's 40-character hash */
export function getCommitHash(line: string) {
  const match = line.match(commitRegExps.hash)

  if (!match?.groups) {
    throw new Error([
      `Couldn't find a commit hash in the line "${line}"`,
      "This most likely means that a line that's UI isn't being identified as such",
    ].join('\n'))
  }

  return match.groups.hash
}

/** Get a commit's message from its 40-character hash */
export async function getCommitMessage(hash: string) {
  return unwrap(await $`git log --format=%s -n 1 ${hash}`)
}

/** Get a commit's PR if it has one */
export function getCommitPr(message: string) {
  return message.match(commitRegExps.pr)?.groups?.pr
}

/** Get a commit's notes if it has any */
export async function getCommitNotes(hash: string) {
  try {
    const notes = unwrap(await $`git notes show ${hash}`)
    return notes
  } catch (error) {
    return undefined
  }
}

import { $ } from 'zx'

import { CustomError } from './error.js'

export const REMOTE = 'https://github.com/redwoodjs/redwood.git'

/** Get the GitHub token from REDWOOD_GITHUB_TOKEN */
export function getGitHubToken() {
  const gitHubToken = process.env.REDWOOD_GITHUB_TOKEN

  if (!gitHubToken) {
    throw new CustomError("The `REDWOOD_GITHUB_TOKEN` environment variable isn't set")
  }

  return gitHubToken
}

export async function gqlGitHub({ query, variables }: { query: string; variables?: Record<string, any> }) {
  const gitHubToken = getGitHubToken()

  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${gitHubToken}`,
    },
    body: JSON.stringify({
      query,
      variables,
    }),
  })

  const body = await res.json()

  return body
}

export async function getUserLogin() {
  const { data } = await gqlGitHub({ query: `query { viewer { login } }`})
  return data.viewer.login
}

export async function pullBranch(branch: string) {
  await $`git switch ${branch}`
  await $`git pull ${REMOTE} ${branch}`
}

export async function pushBranch(branch: string) {
  await $`git push ${REMOTE} ${branch}`
}

/**
 * Fetches notes from the remote.
 *
 * See https://stackoverflow.com/questions/18268986/git-how-to-push-messages-added-by-git-notes-to-the-central-git-server.
 */
export async function fetchNotes() {
  await $`git fetch ${REMOTE} 'refs/notes/*:refs/notes/*'`
}

export async function pushNotes() {
  await $`git push ${REMOTE} 'refs/notes/*'`
}

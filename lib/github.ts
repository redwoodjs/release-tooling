import { chalk, $ } from 'zx'

import { CustomError } from './custom_error.js'

export function getGitHubToken() {
  const gitHubToken = process.env.REDWOOD_GITHUB_TOKEN
  if (!gitHubToken) {
    throw new CustomError("The `REDWOOD_GITHUB_TOKEN` environment variable isn't set")
  }
  return gitHubToken
}

export function getGitHubFetchHeaders() {
  const gitHubToken = getGitHubToken()
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${gitHubToken}`,
  }
}

export async function gqlGitHub({ query, variables }: { query: string; variables?: Record<string, any> }) {
  const headers = getGitHubFetchHeaders()
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      query,
      variables,
    }),
  })
  const body = await res.json()
  return body
}

export async function getUserLogin() {
  const { data } = await gqlGitHub({ query: `query { viewer { login } }` })
  return data.viewer.login
}

export async function pullBranch(branch: string, remote: string) {
  await $`git switch ${branch}`
  await $`git pull ${remote} ${branch}`
}

export async function pushBranch(branch: string, remote: string) {
  await $`git push ${remote} ${branch}`
}

/**
 * Fetches notes from the remote.
 *
 * See https://stackoverflow.com/questions/18268986/git-how-to-push-messages-added-by-git-notes-to-the-central-git-server.
 */
export async function fetchNotes(remote: string) {
  await $`git fetch ${remote} 'refs/notes/*:refs/notes/*'`
  console.log(`Fetched notes from ${remote}`)
}

export async function pushNotes(remote: string) {
  await $`git push ${remote} 'refs/notes/*'`
}

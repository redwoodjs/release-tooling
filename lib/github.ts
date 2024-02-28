export function getGitHubFetchHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.REDWOOD_GITHUB_TOKEN}`,
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
  return res.json()
}

export async function getUserLogin() {
  const { data } = await gqlGitHub({ query: `query { viewer { login } }` })
  return data.viewer.login
}

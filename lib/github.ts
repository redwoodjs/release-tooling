export function getGitHubFetchHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${process.env.REDWOOD_GITHUB_TOKEN}`,
  };
}

export async function gqlGitHub<TResult = any>({
  query,
  variables,
}: {
  query: string;
  variables?: Record<string, any>;
}) {
  const headers = getGitHubFetchHeaders();

  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers,
    body: JSON.stringify({
      query,
      variables,
    }),
  });

  return res.json() as Promise<{ data: TResult }>;
}

export async function getUserLogin() {
  const { data } = await gqlGitHub({ query: `query { viewer { login } }` });
  return data.viewer.login;
}

export const labelsToIds = {
  "release:docs": "LA_kwDOC2M2f87xfriY",
  "release:chore": "LA_kwDOC2M2f87afZ1K",
  "release:fix": "LA_kwDOC2M2f87afaDD",
  "release:feature": "LA_kwDOC2M2f87afaQF",
  "release:breaking": "MDU6TGFiZWwyMzE0NzAxNTIx",

  "changesets-ok": "LA_kwDOC2M2f88AAAABjTb7Bw",
  "changelog-ok": "LA_kwDOC2M2f88AAAABh6ePeA",
  "fixture-ok": "LA_kwDOC2M2f88AAAABBKQskg",
};

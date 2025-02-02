import { gqlGitHub } from "./github.js";

interface Release {
  id: string;
  name: string;
  createdAt: string;
  tag: {
    id: string;
    name: string;
  };
}

export async function getLast20Releases() {
  const res = await gqlGitHub<{
    repository: { releases: { nodes: Array<Release> } };
  }>({
    query: `\
      {
        repository(owner: "redwoodjs", name: "redwood") {
          releases(first: 20, orderBy: { field: CREATED_AT, direction: DESC }) {
            nodes {
              id
              name
              createdAt
              tag {
                id
                name
              }
            }
          }
        }
      }
    `,
  });

  return res.data.repository.releases.nodes;
}

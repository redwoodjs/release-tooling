import { fileURLToPath } from "node:url";

import { fs } from "zx";

import { CustomError } from "./custom_error.js";
import { getGitHubFetchHeaders, gqlGitHub } from "./github.js";
import { logs } from "./logs.js";
import type { PR } from "./types.js";

export async function getPrMilestone(prUrl: string) {
  if (!cache) {
    cache = await setUpCache();
  }
  if (cache.has(prUrl)) {
    return cache.get(prUrl);
  }
  const milestone = await getPrMilestoneInternal(prUrl);
  cache.set(prUrl, milestone);
  return milestone;
}

export async function getPrMilestoneInternal(prUrl: string) {
  const { data } = await gqlGitHub({
    query: getPrMilestoneQuery,
    variables: { prUrl },
  });
  return data.resource.milestone.title;
}

let cache: Map<string, string>;

async function setUpCache() {
  process.on("exit", () => {
    if (cache.size === 0) {
      return;
    }
    fs.writeJsonSync(cacheFilePath, Object.fromEntries(cache), { spaces: 2 });
  });

  const cacheFilePath = fileURLToPath(
    new URL("pr_milestone_cache.json", import.meta.url),
  );
  if (!(await fs.pathExists(cacheFilePath))) {
    return new Map<string, string>();
  }

  const prMilestoneCache = await fs.readJson(cacheFilePath);
  return new Map<string, string>(Object.entries(prMilestoneCache));
}

const getPrMilestoneQuery = `\
  query getPrMilestone($prUrl: URI!) {
    resource(url: $prUrl) {
      ...on PullRequest {
        milestone {
          title
        }
      }
    }
  }
`;

export async function getPrsWithMilestone(milestone?: string): Promise<PR[]> {
  const search = ["repo:redwoodjs/redwood", "is:pr", "is:merged"];
  if (!milestone) {
    search.push("no:milestone");
  } else {
    search.push(`milestone:${milestone}`);
  }

  const res = await gqlGitHub({
    query: getPrsFromSearchQuery,
    variables: { search: search.join(" ") },
  });
  const prs = res.data.search.nodes;
  prs.sort(sortPrsByMergedAt);

  return prs;
}

export function sortPrsByMergedAt(prA: PR, prB: PR) {
  return new Date(prA.mergedAt) > new Date(prB.mergedAt) ? 1 : -1;
}

export const getPrsFromSearchQuery = `\
  query ($search: String!) {
    search(
      query: $search
      first: 100
      type: ISSUE
    ) {
      nodes {
        ... on PullRequest {
          id
          number
          title
          url
          mergeCommit {
            messageHeadline
          }
          mergedAt
          milestone {
            title
          }
          author {
            login
          }
        }
      }
    }
  }
`;

export const milestonesToIds = {
  chore: "MDk6TWlsZXN0b25lNjc4MjU1MA==",
  "next-release": "MI_kwDOC2M2f84Aa82f",
  "next-release-patch": "MDk6TWlsZXN0b25lNjc1Nzk0MQ==",
};

export async function assertNoNoMilestonePrs() {
  const noMilestonePrs = await getPrsWithMilestone();

  if (noMilestonePrs.length > 0) {
    throw new CustomError(
      [
        `Some PRs have been merged without a milestone`,
        ...noMilestonePrs.map((pr) => `• ${pr.url}`),
      ].join("\n"),
    );
  }
}

export async function updatePrMilestone(prId: string, milestoneId: string) {
  return gqlGitHub({
    query: updatePrMilestoneMutation,
    variables: {
      prId,
      milestoneId: milestoneId,
    },
  });
}

const updatePrMilestoneMutation = `\
  mutation ($prId: ID!, $milestoneId: ID) {
    updatePullRequest(input: { pullRequestId: $prId, milestoneId: $milestoneId }) {
      clientMutationId
    }
  }
`;

export async function createMilestone(title: string) {
  const headers = getGitHubFetchHeaders();
  const res = await fetch(
    `https://api.github.com/repos/redwoodjs/redwood/milestones`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({ title }),
    },
  );
  const json = await res.json();
  return {
    id: json.node_id,
    title: json.title,
    number: json.number,
  };
}

export async function closeMilestone(title: string) {
  const milestone = await getMilestone(title);

  const url = `https://api.github.com/repos/redwoodjs/redwood/milestones/${milestone.number}`;
  logs.push(`Posting to ${url}`);
  const headers = getGitHubFetchHeaders();

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({ state: "closed" }),
  });
  const json = await res.json();
  logs.push("close milestone response json", json);
}

interface Milestone {
  id: string;
  title: string;
  number: number;
  createdAt: string;
}

export async function getMilestones() {
  const res = await gqlGitHub<{
    repository: { milestones: { nodes: Array<Milestone> } };
  }>({ query: generateGetMilestonesQuery(["OPEN"]) });

  return res.data.repository.milestones.nodes;
}

export async function getAllMilestones() {
  const res = await gqlGitHub<{
    repository: { milestones: { nodes: Array<Milestone> } };
  }>({
    query: generateGetMilestonesQuery(["OPEN", "CLOSED"]),
  });

  return res.data.repository.milestones.nodes;
}

function generateGetMilestonesQuery(states: Array<"OPEN" | "CLOSED">) {
  return `\
  {
    repository(owner: "redwoodjs", name: "redwood") {
      milestones(last: 100, states: [${states.join(",")}]) {
        nodes {
          id
          title
          number
          createdAt
        }
      }
    }
  }
`;
}

export async function getMilestone(title: string) {
  const milestones = await getMilestones();
  const milestone = milestones.find((milestone) => milestone.title === title);
  if (!milestone) {
    throw new Error(`Couldn't find an open milestone the the title "${title}"`);
  }
  return milestone;
}

const getPrsInMilestoneQuery = `\
  query ($milestoneNumber: Int!) {
    repository(owner: "redwoodjs", name: "redwood") {
      milestone(number: $milestoneNumber) {
        pullRequests(first: 100) {
          nodes {
            title
            number
            url
            labels(first: 10) {
              nodes {
                name
              }
            }
            author {
              login
            }
          }
        }
      }
    }
  }
`;

interface PullRequest {
  title: string;
  number: number;
  url: string;
  labels: {
    nodes: Array<{ name: string }>;
  };
  author: {
    login: string;
  };
}

export async function getPrsInMilestone(milestoneNumber: number) {
  const res = await gqlGitHub<{
    repository: { milestone: { pullRequests: { nodes: Array<PullRequest> } } };
  }>({
    query: getPrsInMilestoneQuery,
    variables: { milestoneNumber },
  });

  return res.data.repository.milestone.pullRequests.nodes;
}

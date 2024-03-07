import { gqlGitHub, labelsToIds } from "@lib/github.js";
import { milestonesToIds } from "@lib/milestones.js";

async function main() {
  console.log("Getting renovate PRs...");
  const prs = await getRenovatePrs();
  if (prs.length === 0) {
    console.log("✨ No renovate PRs");
    return;
  }

  console.log(`Found ${prs.length} PRs`);
  console.log(prs.map(pr => `• ${pr.title}`).join("\n"));
  console.log();

  for (const pr of prs) {
    console.log(`Updating PR #${pr.number}...`);
    await updatePr(pr.id);
    console.log("Done");
  }
}

await main();

async function getRenovatePrs() {
  const query = `\
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
            milestone {
              title
            }
            mergedAt
          }
        }
      }
    }
  `;

  const variables = {
    search: "repo:redwoodjs/redwood is:open is:pr author:app/renovate",
  };

  const { data } = await gqlGitHub({ query, variables });
  return data.search.nodes;
}

async function updatePr(prId: string) {
  const query = `\
    mutation update($prId: ID!, $milestoneId: ID!, $labelIds: [ID!]) {
      updatePullRequest(
        input: {pullRequestId: $prId, milestoneId: $milestoneId, labelIds: $labelIds}
      ) {
        clientMutationId
      }
    }
  `;

  await gqlGitHub({
    query,
    variables: {
      prId,
      milestoneId: milestonesToIds["next-release"],
      labelIds: [labelsToIds["release:chore"], labelsToIds["changelog-ok"], labelsToIds["fixture-ok"]],
    },
  });
}

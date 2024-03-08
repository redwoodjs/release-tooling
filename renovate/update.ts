import { gqlGitHub, labelsToIds } from "@lib/github.js";
import { getPrsFromSearchQuery, milestonesToIds } from "@lib/milestones.js";
import type { PR } from "@lib/types.js";

async function main() {
  console.log("Getting renovate and dependabot PRs...");
  const prs = await getPrs();
  if (prs.length === 0) {
    console.log("✨ No renovate or dependabot PRs");
    return;
  }

  console.log();
  console.log(`Found ${prs.length} PRs`);
  console.log(prs.map(pr => `• ${pr.title}`).join("\n"));
  console.log();

  for (const pr of prs) {
    console.log(`Updating PR "#${pr.title}"...`);
    await updatePr(pr.id);
    console.log("Done");
  }
}

await main();

async function getPrs() {
  const renovatePrs = await getRenovatePrs();
  const dependabotPrs = await getDependabotPrs();
  return [...renovatePrs, ...dependabotPrs];
}

async function getRenovatePrs(): Promise<PR[]> {
  const variables = {
    search: "repo:redwoodjs/redwood is:open is:pr author:app/renovate",
  };
  const { data } = await gqlGitHub({ query: getPrsFromSearchQuery, variables });
  return data.search.nodes;
}

async function getDependabotPrs(): Promise<PR[]> {
  const variables = {
    search: "repo:redwoodjs/redwood is:open is:pr author:app/dependabot",
  };
  const { data } = await gqlGitHub({ query: getPrsFromSearchQuery, variables });
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
      labelIds: [labelsToIds["release:chore"], labelsToIds["changesets-ok"], labelsToIds["fixture-ok"]],
    },
  });
}

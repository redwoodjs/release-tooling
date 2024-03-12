import { getMilestones, getPrsWithMilestone } from "@lib/milestones.js";
import { prompts } from "@lib/prompts.js";
import type { PR } from "@lib/types.js";

async function main() {
  const milestone = await getMilestone();
  console.log();
  const prs = await getPrsWithMilestone(milestone);
  const renovatePrs = prs.filter(authorIsRenovate);
  const releaseNotes = renovatePrs.map(getReleaseNotes);
  printReleaseNotes(releaseNotes);
}

await main();

async function getMilestone() {
  const milestones = await getMilestones();
  const { milestone } = await prompts({
    name: "milestone",
    message: "Milestone?",
    type: "select",
    choices: milestones.map((milestone) => ({ title: milestone.title, value: milestone.title })),
  });
  return milestone;
}

function authorIsRenovate(pr: PR) {
  return pr.author.login === "renovate";
}

function getReleaseNotes(pr: PR) {
  return `<li>${pr.title} #${pr.number}</li>`;
}

function printReleaseNotes(releaseNotes: string[]) {
  console.log([
    "## Dependencies",
    "",
    "<details>",
    "<summary>Click to see all upgraded dependencies</summary>",
    "<ul>",
    ...releaseNotes,
    "</ul>",
    "</details>",
    "",
  ].join("\n"));
}

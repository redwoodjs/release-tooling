import { getPrsWithMilestone } from "@lib/milestones.js";

async function main() {
  const prs = await getPrsWithMilestone("next-release");
  const renovatePrs = prs.filter(authorIsRenovate);
  const releaseNotes = renovatePrs.map(getReleaseNotes);
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

await main();

function authorIsRenovate(pr) {
  return pr.author.login === "renovate";
}

function getReleaseNotes(pr) {
  return `<li>${pr.title} #${pr.number}</li>`;
}

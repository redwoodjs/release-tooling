import { getReleaseBranches } from "@lib/branches.js";
import { prompts } from "@lib/prompts.js";

export async function getRange() {
  const releaseBranches = await getReleaseBranches();
  console.log();

  const choices = [
    "main...next",
    ...releaseBranches.map((branch) => `next...${branch}`),
  ].map((branch) => {
    return {
      title: branch,
      value: branch,
    };
  });

  const rangeRes = await prompts({
    name: "range",
    type: "select",
    message: "Which range do you want to triage?",
    choices,
  });

  const [from, to] = rangeRes.range.split("...");

  return {
    from,
    to,
  };
}

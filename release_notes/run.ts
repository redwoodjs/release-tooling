import "dotenv/config";

import fs from "node:fs/promises";

import { $, chalk } from "zx";

import { assertGitHubToken } from "@lib/assert_github_token.js";
import { consoleBoxen, logSection } from "@lib/console_helpers.js";
import { CustomError } from "@lib/custom_error.js";
import { assertRwfwPathAndSetCwd } from "@lib/cwd.js";
import { setUpLogs } from "@lib/logs.js";
import { getAllMilestones, getPrsInMilestone } from "@lib/milestones.js";
import { getLast20Releases } from "@lib/releases.js";
import { prompts } from "@lib/prompts.js";
import { unwrap } from "@lib/zx_helpers.js";

interface ChangesetItem {
  prNumber: number;
  title: string;
  author: string;
  content: string | undefined;
}

try {
  setUpLogs(new URL("../release-notes_log.json", import.meta.url));

  assertGitHubToken();

  logSection(
    "Getting the path to the Redwood monorepo via RWFW_PATH and cd-ing there",
  );
  await assertRwfwPathAndSetCwd();

  // logSection(
  //   "Getting the name of the release to generate release notes for",
  // );
  // const branchName = await getBranchName();

  // Get a list of all GitHub milestones
  logSection("Determining the milestone to generate release notes for");

  const milestones = await getAllMilestones();
  const sortedMilestones = milestones.sort(
    (m1, m2) =>
      new Date(m2.createdAt).getTime() - new Date(m1.createdAt).getTime(),
  );

  const releases = await getLast20Releases();

  const localBranchName = await getLocalBranchName();

  // Check if there's a milestone name that matches the branch name
  const matchingMilestone = milestones.find((milestone) =>
    localBranchName.endsWith("/" + milestone.title),
  );

  let selectedMilestone = matchingMilestone;

  if (!selectedMilestone) {
    const milestoneChoices = sortedMilestones
      .filter(
        (milestone) =>
          milestone.title.startsWith("v") &&
          new Date(milestone.createdAt).getTime() >
            new Date(releases.at(-1)?.createdAt || "").getTime(),
      )
      .map((milestone) => ({
        title: milestone.title,
        value: milestone,
      }));

    const promptedMilestone = await prompts({
      type: "select",
      name: "milestone",
      message: "No matching milestone found. Please select a milestone:",
      choices: milestoneChoices,
    });

    if (!promptedMilestone.milestone) {
      throw new CustomError(
        "No milestone selected",
        "Please select a milestone to continue.",
      );
    }

    selectedMilestone = promptedMilestone.milestone;
  }

  if (!selectedMilestone) {
    throw new CustomError(
      "No milestone selected",
      "This is an error in the script",
    );
  }

  console.log("Selected milestone:", selectedMilestone.title);

  logSection("Gathering changesets for the PRs in the milestone");

  const pullRequests = await getPrsInMilestone(selectedMilestone.number);

  console.log(chalk.bold("\nPull Requests:"));
  pullRequests.forEach((pr) => {
    console.log(chalk.cyan(`  #${pr.number}: ${pr.title}`));
    console.log(chalk.gray(`    Author: ${pr.author.login}`));
    console.log(chalk.yellow("    Labels:"));
    pr.labels.nodes.forEach((label) => {
      console.log(chalk.yellow(`      - ${label.name}`));
    });
    console.log(); // Add a blank line between PRs
  });

  console.log(
    `Found ${pullRequests.length} pull requests for milestone ${selectedMilestone.title}`,
  );

  const prNumbers = pullRequests.map((pr) => pr.number);

  const changesets: {
    feature: Array<ChangesetItem>;
    fix: Array<ChangesetItem>;
    docs: Array<ChangesetItem>;
    dependency: Array<ChangesetItem>;
    chore: Array<ChangesetItem>;
  } = {
    feature: [],
    fix: [],
    docs: [],
    dependency: [],
    chore: [],
  };

  await Promise.all(
    prNumbers.map(async (prNumber: number) => {
      const changesetPath = `.changesets/${prNumber}.md`;
      const changesetMd = await fs
        .readFile(changesetPath, "utf-8")
        .catch(() => null);

      // Remove the first line of the changeset file
      //   - PR title (#prNumber) by @author
      // We rebuild the title from the PR data
      const changesetContent = changesetMd
        ?.split("\n")
        .slice(1)
        .join("\n")
        .trim();

      const pr = pullRequests.find((pr) => pr.number === prNumber);

      if (!pr) {
        throw new CustomError(
          "PR not found",
          `PR #${prNumber} not found in the list of PRs for milestone ${selectedMilestone.title}`,
        );
      }

      const releaseLabel = pr.labels.nodes.find(
        (label) => label.name === "dependencies",
      )
        ? { name: "release:dependency" }
        : pr.labels.nodes.find((label: { name: string }) =>
            label.name.startsWith("release:"),
          );

      let type: keyof typeof changesets = "chore";
      if (releaseLabel) {
        const labelType = releaseLabel.name.split(":")[1];
        if (isLabelType(labelType)) {
          type = labelType;
        }
      }

      changesets[type]?.push({
        prNumber,
        title: pr.title,
        author: pr.author.login,
        content: changesetContent,
      });
    }),
  );

  const releaseNotes =
    "# Changelog\n\n" +
    notes("## 🚀 Features", changesets.feature) +
    notes("## 🛠️ Fixes", changesets.fix) +
    notes("## 📚 Docs", changesets.docs) +
    liNotes(
      "## 📦 Dependencies",
      "Click to see all dependency updates",
      changesets.dependency,
    ) +
    liNotes(
      "## 🧹 Chore",
      "Click to see all chore contributions",
      changesets.chore,
    );

  console.log(releaseNotes);
} catch (error) {
  process.exitCode = 1;

  if (error instanceof CustomError) {
    consoleBoxen(error.title, error.message);
  } else {
    throw error;
  }
}

function isLabelType(
  labelType: string,
): labelType is "feature" | "fix" | "docs" | "dependency" | "chore" {
  return ["feature", "fix", "docs", "dependency", "chore"].includes(labelType);
}

async function getLocalBranchName() {
  const currentBranch = unwrap(await $`git branch --show-current`);

  if (currentBranch.startsWith("release/")) {
    return currentBranch;
  }

  return "";
}

function notes(title: string, changesets: Array<ChangesetItem>) {
  if (!changesets.length) {
    return "";
  }

  return (
    `${title}\n\n` +
    changesets
      .map((changeset) => {
        const summary = `${changeset.title} (#${changeset.prNumber}) by @${changeset.author}`;

        if (changeset.content) {
          return [
            "<details>",
            `<summary>${summary}</summary>`,
            changeset.content,
            "</details>",
          ].join("\n");
        }

        return `- ${summary}`;
      })
      .join("\n") +
    "\n\n"
  );
}

function liNotes(
  title: string,
  summary: string,
  changesets: Array<ChangesetItem>,
) {
  if (!changesets.length) {
    return "";
  }

  return (
    `${title}\n\n` +
    "<details>\n" +
    `  <summary>${summary}</summary>\n` +
    "  <ul>\n" +
    changesets
      .map((changeset) => {
        return `    <li>${changeset.title} (#${changeset.prNumber}) by @${changeset.author}</li>`;
      })
      .join("\n") +
    "\n" +
    "  </ul>\n" +
    "</details>\n\n"
  );
}

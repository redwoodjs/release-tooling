import { $, spinner } from "zx";

import {
  commitIsInRef,
  commitRegExps,
  getCommitHash,
  getCommitMessage,
  getCommitNotes,
  getCommitPr,
} from "@lib/commits.js";
import { logs } from "@lib/logs.js";
import { getPrMilestone } from "@lib/milestones.js";
import type { Commit, Range } from "@lib/types.js";
import { unwrap } from "@lib/zx_helpers.js";

import { colors } from "./colors.js";

export const gitLogOptions = [
  "--oneline",
  "--no-abbrev-commit",
  "--left-right",
  "--graph",
  "--left-only",
  "--cherry-pick",
  "--boundary",
];

/* Get the symmetric difference between two refs. (Basically, what's different about them.) */
export async function getSymmetricDifference(
  range: Range,
) {
  $.verbose = false;
  const symmetricDifference = unwrap(
    await $`git log ${gitLogOptions} ${range.from}...${range.to}`,
  ).split("\n");
  $.verbose = true;
  return symmetricDifference;
}

/** Resolves the return of `getSymmetricDifference` */
export async function resolveSymmetricDifference(
  lines: string[],
  { range }: { range: Range },
) {
  return spinner("Resolving symmetric difference", () => {
    return Promise.all(lines.map((line) => resolveLine(line, { range })));
  });
}

export const PADDING = 130;

export async function resolveLine(line: string, { range }: { range: Range }) {
  const commit: Commit = {
    line,
    type: "commit",
    ref: range.from,
  };

  if (lineIsGitLogUi(commit.line)) {
    commit.type = "ui";
    logs.push("ui", commit);
    return commit;
  }

  commit.hash = getCommitHash(commit.line);
  commit.message = await getCommitMessage(commit.hash);

  if (lineIsAnnotatedTag(commit.message)) {
    commit.type = "tag";
    commit.ref = commit.message;
    logs.push("tag", commit);
    return commit;
  }

  if (lineIsChore(line)) {
    commit.type = "chore";
    logs.push("chore", commit);
    return commit;
  }

  if (await commitIsInRef(range.to, commit.message)) {
    commit.ref = range.to;
  }
  commit.notes = await getCommitNotes(commit.hash);

  commit.pr = getCommitPr(commit.message);
  if (!commit.pr) {
    logs.push("commit", commit);
    return commit;
  }
  commit.url = `https://github.com/redwoodjs/redwood/pull/${commit.pr}`;
  commit.milestone = await getPrMilestone(commit.url);
  commit.line = [commit.line.padEnd(PADDING), `(${commit.milestone})`].join(" ");

  logs.push("pr", commit);
  return commit;
}

const MARKS = ["o", "/", "|\\", "| o", "|\\|", "|/"];

/** Determine if a line from `git log --graph` is just UI */
export function lineIsGitLogUi(line: string) {
  for (const mark of MARKS) {
    if (line.trim().startsWith(mark)) {
      return true;
    }
  }

  return false;
}

export function lineIsAnnotatedTag(message: string) {
  return commitRegExps.annotatedTag.test(message);
}

/** Determine if a line from `git log` is a chore commit */
export function lineIsChore(line: string) {
  const choreMessages = [
    "chore: update yarn.lock",
    "Version docs",
    "chore: update all contributors",
  ];

  return (
    /Merge branch (?<branch>.*)/.test(line)
    || choreMessages.some((message) => line.includes(message))
  );
}

export function getPrettyLine(commit: Commit, { range }: { range: Range }) {
  if (
    commit.type === "ui"
    || commit.type === "tag"
    || commit.type === "chore"
  ) {
    return colors.choreOrDecorative(commit.line);
  }

  if (commit.ref === range.to) {
    return colors.wasCherryPickedWithChanges(commit.line);
  }

  if (!!commit.notes || commit.milestone === "SSR" || commit.milestone === "RSC") {
    return colors.shouldntBeCherryPicked(commit.line);
  }

  return commit.line;
}

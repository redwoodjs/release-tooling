import { CustomError } from "@lib/custom_error.js";

import { $, chalk } from "zx";

/**
 * Fetches notes from the remote.
 * We use notes to document commits that we aren't cherry picking.
 *
 * See https://stackoverflow.com/questions/18268986/git-how-to-push-messages-added-by-git-notes-to-the-central-git-server.
 */
export async function fetchNotes(remote: string) {
  try {
    await $`git fetch ${remote} 'refs/notes/*:refs/notes/*'`;
  } catch (_error) {
    throw new CustomError([
      "Couldn't fetch git notes. This usually means you have a note locally that conflicts with one on the remote.",
      "The best course of action may just be to delete your local notes and try again:",
      "",
      chalk.green("  cd $RWFW_PATH"),
      chalk.green("  rm .git/refs/notes/commits"),
      chalk.green("  git gc"),
    ].join("\n"));
  }
}

export async function pushNotes(remote: string) {
  await $`git push ${remote} 'refs/notes/*'`;
}

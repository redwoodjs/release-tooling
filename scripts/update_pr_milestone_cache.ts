import { fileURLToPath } from "node:url";

import { fs } from "zx";

import { getPrMilestoneInternal } from "@lib/milestones.js";

const cacheFilePath = fileURLToPath(new URL("../lib/pr_milestone_cache.json", import.meta.url));
const cache = await fs.readJson(cacheFilePath);

let ok = 0;
const updated: string[] = [];
let lastMessageLineCount = 0;

function writeMessage() {
  // Move cursor back to the start of the message area
  if (lastMessageLineCount > 0) {
    process.stdout.moveCursor(0, -lastMessageLineCount + 1);
  }

  // Clear each line of the previous message
  for (let i = 0; i < lastMessageLineCount; i++) {
    process.stdout.clearLine(0);

    // Move the cursor down only if it's not the last line
    if (i < lastMessageLineCount - 1) {
      process.stdout.cursorTo(0);
      process.stdout.moveCursor(0, 1);
    }
  }

  // After clearing everything, move the cursor back to the start of the message area
  process.stdout.cursorTo(0);
  if (lastMessageLineCount > 0) {
    process.stdout.moveCursor(0, -lastMessageLineCount + 1);
  }

  // Write the new message
  const message = [
    `${ok} ok`,
    ...updated,
  ].join("\n");

  process.stdout.write(message);

  // Update lastMessageLineCount for the next write
  lastMessageLineCount = message.split("\n").length;
}

for (const [prUrl] of Object.entries(cache)) {
  const milestone = await getPrMilestoneInternal(prUrl);
  if (milestone === cache[prUrl]) {
    ok += 1;
    writeMessage();
    continue;
  }

  updated.push(`• updated ${prUrl} from ${cache[prUrl]} to ${milestone}`);
  cache[prUrl] = milestone;
  writeMessage();
}

await fs.writeJson(cacheFilePath, cache, { spaces: 2 });

import { $, fs } from "zx";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { assertRwfwPathAndSetCwd } from "@lib/cwd.js";

import { resolveSymmetricDifference } from "./symmetric_difference.js";

$.verbose = false;

describe("resolveSymmetricDifference", () => {
  let resetCwd: () => void;
  beforeAll(async () => {
    resetCwd = await assertRwfwPathAndSetCwd();
  });
  afterAll(() => {
    resetCwd();
  });

  it("works", async () => {
    const lines = await fs.readJson(new URL("main_next.sym_diff.json", import.meta.url));
    const commits = await resolveSymmetricDifference(lines, { range: { from: "main", to: "next" } });
    expect(commits).toMatchSnapshot();
  }, 40_000);
});

import { describe, expect, it } from "vitest";

import { branchExists, getReleaseBranchesFromStdout } from "./branches.js";

describe("branchExists", () => {
  it("works", async () => {
    const exists = await branchExists("main");
    expect(exists).toBe(true);
  });

  it("returns false if the branch doesn't exist", async () => {
    const exists = await branchExists("nonexistent-branch");
    expect(exists).toBe(false);
  });
});

describe("getReleaseBranches", () => {
  it("works", () => {
    const releaseBranches = getReleaseBranchesFromStdout(
      "release/patch/v7.0.4\nrelease/minor/v7.1.0\nrelease/patch/v7.0.5",
    );
    expect(releaseBranches).toEqual(["release/minor/v7.1.0", "release/patch/v7.0.5", "release/patch/v7.0.4"]);
  });

  it("returns an empty array if there's no release branches", () => {
    const releaseBranches = getReleaseBranchesFromStdout("");
    expect(releaseBranches).toEqual([]);
  });

  it("handles a release branch currently being checked out", () => {
    const releaseBranches = getReleaseBranchesFromStdout("release/patch/v7.0.4\n* release/patch/v7.0.5");
    expect(releaseBranches).toEqual(["release/patch/v7.0.5", "release/patch/v7.0.4"]);
  });
});

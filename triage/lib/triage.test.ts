import { describe, expect, test } from "vitest";
import { $ } from "zx";

import { commitIsEligibleForCherryPick } from "./triage.js";

$.verbose = false;

describe("triage", () => {
  test("commitIsEligibleForCherryPick", () => {
    const range = { from: "main", to: "next" };
    const commit = {};

    commit.type = "ui";
    expect(commitIsEligibleForCherryPick(commit, { range })).toEqual(false);
    commit.type = "tag";
    expect(commitIsEligibleForCherryPick(commit, { range })).toEqual(false);
    commit.type = "chore";
    expect(commitIsEligibleForCherryPick(commit, { range })).toEqual(false);

    commit.type = "commit";
    commit.ref = range.to;
    expect(commitIsEligibleForCherryPick(commit, { range })).toEqual(false);

    commit.ref = range.from;

    commit.milestone = "SSR";
    expect(commitIsEligibleForCherryPick(commit, { range })).toEqual(false);
    commit.milestone = "RSC";
    expect(commitIsEligibleForCherryPick(commit, { range })).toEqual(false);
    delete commit.milestone;
    commit.notes = "abc";
    expect(commitIsEligibleForCherryPick(commit, { range })).toEqual(false);

    delete commit.notes;
    expect(commitIsEligibleForCherryPick(commit, { range })).toEqual(true);
  });
});

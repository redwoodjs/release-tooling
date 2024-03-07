import { describe, expect, it } from "vitest";

import {
  closeMilestone,
  // createMilestone,
  getMilestone,
  getMilestones,
  getPrMilestone,
  getPrsWithMilestone,
} from "./milestones.js";

describe("getPrMilestone", () => {
  it("works", async () => {
    const milestone = await getPrMilestone("https://github.com/redwoodjs/redwood/pull/9803");
    expect(milestone).toEqual("chore");
  });
});

describe("getPrsWithMilestone", () => {
  it("works", async () => {
    const prs = await getPrsWithMilestone("v7.0.3");
    expect(prs).toMatchInlineSnapshot(`
      [
        {
          "author": {
            "login": "codisfy",
          },
          "id": "PR_kwDOC2M2f85nkDDh",
          "mergeCommit": {
            "messageHeadline": "Update MetaTags to be MetaData in Docs (#10053)",
          },
          "mergedAt": "2024-02-22T17:44:49Z",
          "milestone": {
            "title": "v7.0.3",
          },
          "number": 10053,
          "title": "Update MetaTags to be Metadata in Docs",
          "url": "https://github.com/redwoodjs/redwood/pull/10053",
        },
        {
          "author": {
            "login": "jtoar",
          },
          "id": "PR_kwDOC2M2f85nszPR",
          "mergeCommit": {
            "messageHeadline": "fix(render): reduce memory and handle server file  (#10055)",
          },
          "mergedAt": "2024-02-23T10:04:32Z",
          "milestone": {
            "title": "v7.0.3",
          },
          "number": 10055,
          "title": "fix(render): reduce memory and handle server file ",
          "url": "https://github.com/redwoodjs/redwood/pull/10055",
        },
        {
          "author": {
            "login": "jnhooper",
          },
          "id": "PR_kwDOC2M2f85nyT1x",
          "mergeCommit": {
            "messageHeadline": "Update studio.md (#10062)",
          },
          "mergedAt": "2024-02-24T01:21:51Z",
          "milestone": {
            "title": "v7.0.3",
          },
          "number": 10062,
          "title": "Update studio.md",
          "url": "https://github.com/redwoodjs/redwood/pull/10062",
        },
      ]
    `);
  });
});

const choreMilestone = {
  title: "chore",
  id: "MDk6TWlsZXN0b25lNjc4MjU1MA==",
  number: 46,
};

describe("getMilestones", () => {
  it("works", async () => {
    const milestones = await getMilestones();
    expect(milestones).toEqual(expect.arrayContaining([
      choreMilestone,
      {
        title: "next-release",
        id: "MI_kwDOC2M2f84Aa82f",
        number: 56,
      },
      {
        title: "next-release-patch",
        id: "MDk6TWlsZXN0b25lNjc1Nzk0MQ==",
        number: 44,
      },
    ]));
  });
});

describe("getMilestone", () => {
  it("works", async () => {
    const milestone = await getMilestone("chore");
    expect(milestone).toEqual(choreMilestone);
  });

  it("throws if it can't get the milestone", async () => {
    await expect(() => getMilestone("bazinga")).rejects.toThrowErrorMatchingInlineSnapshot(
      `[Error: Couldn't find an open milestone the the title "bazinga"]`,
    );
  });
});

describe("createMilestone and closeMilestone", () => {
  describe("closeMilestone", () => {
    it("throws if it can't close the milestone", async () => {
      await expect(() => closeMilestone("bazinga")).rejects.toThrowErrorMatchingInlineSnapshot(
        `[Error: Couldn't find an open milestone the the title "bazinga"]`,
      );
    });

    it("throws if the milestone is already closed", async () => {
      await expect(() => closeMilestone("v7.0.4")).rejects.toThrowErrorMatchingInlineSnapshot(
        `[Error: Couldn't find an open milestone the the title "v7.0.4"]`,
      );
    });
  });

  // it('works', async () => {
  //   const milestone = await createMilestone('release-tooling-test')
  //   expect(milestone).toMatchInlineSnapshot()
  //   const res = await closeMilestone('release-tooling-test')
  //   expect(res).toMatchInlineSnapshot()
  // })
});

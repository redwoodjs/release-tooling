import { describe, expect, it, test } from "vitest";

import { assertGitHubToken } from "./assert_github_token.js";
import { getGitHubFetchHeaders, getUserLogin } from "./github.js";

describe("github ", () => {
  describe("assertGitHubToken", () => {
    it("works", () => {
      expect(process.env.REDWOOD_GITHUB_TOKEN).toBeDefined();
      expect(assertGitHubToken).not.toThrow();
    });

    it("throws if `REDWOOD_GITHUB_TOKEN` isn't defined", () => {
      const originalToken = process.env.REDWOOD_GITHUB_TOKEN;
      delete process.env.REDWOOD_GITHUB_TOKEN;
      expect(process.env.REDWOOD_GITHUB_TOKEN).toBeUndefined();
      expect(assertGitHubToken).toThrow();
      process.env.REDWOOD_GITHUB_TOKEN = originalToken;
    });
  });

  test("getGitHubFetchHeaders", () => {
    const headers = getGitHubFetchHeaders();
    expect(headers).toHaveProperty("Content-Type", "application/json");
    expect(headers).toHaveProperty("Authorization");
  });

  test("getUserLogin", async () => {
    assertGitHubToken();
    const login = await getUserLogin();
    expect(login).toBeDefined();
  });
});

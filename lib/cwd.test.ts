import { describe, expect, it } from "vitest";

import { assertRwfwPathAndSetCwd } from "./cwd.js";

describe("assertRwfwPathAndSetCwd", () => {
  it("works", async () => {
    const originalCwd = process.cwd();
    const resetCwd = await assertRwfwPathAndSetCwd();
    expect(process.cwd()).toEqual(process.env.RWFW_PATH);
    resetCwd();
    expect(process.cwd()).toEqual(originalCwd);
  });

  it("throws if RWFW_PATH isn't set", async () => {
    const originalRwfwPath = process.env.RWFW_PATH;
    delete process.env.RWFW_PATH;
    expect(process.env.RWFW_PATH).toBeUndefined();
    await expect(() => assertRwfwPathAndSetCwd()).rejects.toThrowError();
    process.env.RWFW_PATH = originalRwfwPath;
  });
});

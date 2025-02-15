import promptsModule from "prompts";
import type { Options, PromptObject } from "prompts";

/** Wrapper around `prompts` to exit on Ctrl + C */
export function prompts<T extends string = string>(
  promptsObject: PromptObject<T>,
  promptsOptions: Options = {},
) {
  return promptsModule<T>(promptsObject, {
    ...promptsOptions,
    onCancel: () => process.exit(1),
  });
}

export function resolveRes(res: string) {
  const isYes = resIsYes(res);
  if (isYes) {
    return "yes";
  }

  const isOpen = resIsOpen(res);
  if (isOpen) {
    return "open";
  }

  const isSkip = resIsSkip(res);
  if (isSkip) {
    return "skip";
  }

  return "no";
}

export function resIsYes(res: string) {
  res = res.toLocaleLowerCase();
  return res === "yes" || res === "y" || res === "";
}

export function resIsOpen(res: string) {
  res = res.toLocaleLowerCase();
  return res === "open" || res === "o";
}

export function resIsSkip(res: string) {
  res = res.toLocaleLowerCase();
  return res === "skip" || res === "s";
}

export async function getDesiredSemver() {
  const choices = ["major", "minor", "patch"];

  const res = await prompts({
    name: "semver",
    message: "Which semver do you want to release?",
    type: "select",
    choices: choices.map((choice) => ({ title: choice, value: choice })),
    // Set to 'patch' because that's the most common.
    initial: 2,
  });

  return res.semver;
}

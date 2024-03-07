import { $ } from "zx";

async function main() {
  await openDependencyDashboard();
  await openRenovatePrs();
  await openDependabotPrs();
}

await main();

async function openDependencyDashboard() {
  await $`open https://github.com/redwoodjs/redwood/issues/3795`;
}

async function openRenovatePrs() {
  await $`open https://github.com/redwoodjs/redwood/pulls/app%2Frenovate`;
}

async function openDependabotPrs() {
  await $`open https://github.com/redwoodjs/redwood/pulls/app%2Fdependabot`;
}

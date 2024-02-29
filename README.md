# Release tooling

This repository contains release tooling for the [Redwood monorepo](https://github.com/redwoodjs/redwood).

![release](https://github.com/redwoodjs/release-tooling/assets/32992335/6f6e6dbb-c259-49b0-a8dc-f77a654be39f)

## Quick Start

- In your shell start-up file (e.g. `~/.zshrc` or `~/.bashrc`) or a `.env` file (that you create) in this directory, add the following environment variable:

  ```bash
  touch .env

  echo "export RWFW_PATH='/path/to/redwoodjs/redwood'" >> .env
  echo "export REDWOOD_GITHUB_TOKEN='...'" >> .env
  ```

  Where `RWFW_PATH` is the path to your local copy of the Redwood monorepo and `REDWOOD_GITHUB_TOKEN` is a personal access token with the `public_repo` scope.

- Check out the `main` and `next` branches from the Redwood monorepo's remote.

  ```bash
  cd $RWFW_PATH

  git fetch <your-redwood-remote>
  git switch main
  git switch next
  ```

- Run `yarn install` in this directory. It should fly by! This project uses Yarn's [Zero-installs](https://yarnpkg.com/features/caching#zero-installs).

## Commands

### Triage

Redwood has a dual-branch strategy.
Most of the work involves moving commits from the main branch to the next branch.
The `yarn triage` command guides you through this process:

```
yarn triage
```

### Release

When it's time to release, run the `yarn release` command:

```
yarn release
```

## Contributing

Use `yarn lint` and `yarn fmt` to lint and format your code respectively:

```
yarn lint
yarn fmt
```

`yarn lint` uses [ESLint](https://eslint.org/) and `yarn fmt` uses [dprint](https://dprint.dev/). I couldn't get ESLint to play nicely with Yarn's zero-installs, so you'll have to rely on those two CLI commands for the time being.

Running tests requires a bit more setup than I'd like, but here's what you need to do...

- ensure you have the Redwood monorepo locally.
- checkout the `release-tooling/main-test` and `release-tooling/next-test` branches

  ```
  cd $RWFW_PATH
  git switch release-tooling/main-test
  git switch release-tooling/next-test
  ```

Then you should be able to run the tests:

```
yarn test
```

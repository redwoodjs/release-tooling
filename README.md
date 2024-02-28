# Release tooling

This repository contains release tooling for the [Redwood monorepo](https://github.com/redwoodjs/redwood).

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
Most of the work involves moving commits from main to next and then from next to a release branch.
The triage command guides you through this process:

```
yarn triage
```

### Release

When it's time to release, the release command walks you through the process:

```
yarn release
```

Ensure you have access to the RedwoodJS organization on NPM first.

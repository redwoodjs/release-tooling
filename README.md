# Release tooling

Release tooling for Redwood. See the [package.json](./package.json) scripts for the available commands.

## Notes

- This project uses Yarn's [Zero-installs](https://yarnpkg.com/features/caching#zero-installs)
- The code for release is incomplete. Use the release script in the Redwood monorepo for the time being.

## Quick Start

- Within your `.zshrc` or `.bashrc` file (depending on what shell you're using), add the following environment variable:

  ```bash
  export RWFW_PATH=
  ```

  Where `RWFW_PATH` is the path to your local copy of the Redwood monorepo.

  Also, make sure that you've pulled down the `main` and `next` branches and have the latest changes on your machine.

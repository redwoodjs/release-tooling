# Release tooling

Release tooling for Redwood. See the [package.json](./package.json) scripts for the available commands.

## Quick Start

- In your shell start-up file (e.g. `~/.zshrc` or `~/.bashrc`), add the following environment variable:

  ```bash
  export RWFW_PATH='/path/to/redwoodjs/redwood'
  ```

  Where `RWFW_PATH` is the path to your local copy of the Redwood monorepo.

- Make sure that you've checked out the `main` and `next` branches from the Redwood monorepo's remote and have the latest changes on your machine.

## Notes

- This project uses Yarn's [Zero-installs](https://yarnpkg.com/features/caching#zero-installs)
- The code for release is incomplete. Use the release script in the Redwood monorepo for the time being.

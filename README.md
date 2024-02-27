# Release tooling

Release tooling for Redwood. See the [package.json](./package.json) scripts for the available commands.

## Notes

- This project uses Yarn's [Zero-installs](https://yarnpkg.com/features/caching#zero-installs)
- The code for release is incomplete. Use the release script in the RedwoodJS monorepo for the time being.

## Quick Start

- Within your `.zshconfig` or `.bashrc` file (depending on what you're using), add the following alias:

```bash
export RWFW_PATH=
```

Where the `RWFW_PATH` is the path to your local Redwood project.

Also, make sure that you've pulled the `main` and `next` branches and have the latest changes on your local machine.

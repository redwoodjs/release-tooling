import { execaCommand } from 'execa'
import { cd, chalk, fs, path, question, $ } from 'zx'

import { CustomError } from '@lib/error.js'
import { branchExists } from '@lib/git.js'
import { REMOTE } from '@lib/github.js'
import { resIsYes } from '@lib/prompts.js'

import { ReleaseOptions } from './types.js'

export async function release(options: ReleaseOptions) {
  const releaseBranch = ['release', options.desiredSemver, options.nextRelease].join('/')
  await switchToReleaseBranch({ ...options, releaseBranch })

  // TODO(jtoar): There's more to a patch release that should go here.

  const message = options.desiredSemver === 'patch' ?
    `Ok to ${chalk.underline('reversion')} ${chalk.magenta(options.nextRelease)} docs? [Y/n] > ` :
    `Ok to ${chalk.underline('version')} docs to ${chalk.magenta(options.nextRelease)}? [Y/n] > `
  const okToVersionDocs = resIsYes(await question(message))
  if (okToVersionDocs) {
    await versionDocs(options)
  }
  await question('Press anything to clean, install, and update package versions > ')
  await $`git clean -fxd`
  await $`yarn install`
  await updatePackageVersions(options)

  await question('Press anything to run build, lint, and test > ')
  await $`yarn build`
  await $`yarn lint`
  await $`yarn test`

  const ok = resIsYes(await question(`Ok to publish to NPM? [Y/n] > `))
  if (!ok) {
    throw new CustomError("See you later!", "👋")
  }
  // Temporarily remove `packages/create-redwood-app` from the workspaces field so that we can publish it separately later.
  const undoRemoveCreateRedwoodAppFromWorkspaces = await removeCreateRedwoodAppFromWorkspaces()
  await publish()

  // Undo the temporary commit and publish CRWA.
  await undoRemoveCreateRedwoodAppFromWorkspaces()
  await question('Press anything to update create-redwood-app templates > ')
  await updateCreateRedwoodAppTemplates()
  await publish()

  await question('Press anything consolidate commits, tag, and push > ')
  // This combines the update package versions commit and update CRWA commit into one.
  await $`git reset --soft HEAD~2`
  await $`git commit -m "${options.nextRelease}"`
  // Tag and push.
  await $`git tag -am ${options.nextRelease} "${options.nextRelease}"`
  await $`git push -u ${REMOTE} ${releaseBranch} --follow-tags`

  // TODO(jtoar): Offer to merge the release branch into main/next.
}

async function switchToReleaseBranch({ releaseBranch, latestRelease }: Pick<ReleaseOptions, 'latestRelease'> & { releaseBranch: string }) {
  const releaseBranchExists = await branchExists(releaseBranch)

  if (releaseBranchExists) {
    console.log(
      `Checking out the ${chalk.underline('existing')} ${chalk.magenta(releaseBranch)} release branch`
    )
    await $`git switch ${releaseBranch}`
  } else {
    const desiredSemver = releaseBranch.split('/')[1]
    let checkoutFromRef

    switch (desiredSemver) {
      case 'major':
        checkoutFromRef = 'main'
        break
      case 'minor':
        checkoutFromRef = 'next'
        break
      case 'patch':
        checkoutFromRef = latestRelease
        break
    }

    const ok = resIsYes(
      await question(
        `Ok to checkout a ${chalk.underline('new')} release branch, ${chalk.magenta(
          releaseBranch
        )}, from ${chalk.magenta(checkoutFromRef)}? [Y/n] > `
      )
    )
    if (!ok) {
      throw new CustomError("See you later!", "👋")
    }

    await $`git checkout -b ${releaseBranch} ${checkoutFromRef}`
  }
}

async function versionDocs({ desiredSemver, nextRelease }: Pick<ReleaseOptions, 'desiredSemver' | 'nextRelease'>) {
  const nextDocsVersion = nextRelease.slice(1, -2)
  await cd('./docs')

  // If the versioned docs directory already exists (the case for patch releases), remove it and its entry from versions.json.
  if (await fs.pathExists(`./versioned_docs/version-${nextDocsVersion}`)) {
    await $`rm -rf ./versioned_docs/version-${nextDocsVersion}`
    const versions = await fs.readJson('./versions.json')
    await fs.writeJson('./versions.json', versions.slice(1))
  }

  await $`yarn`
  await $`yarn clear`
  await $`yarn docusaurus docs:version ${nextDocsVersion}`
  await $`git add .`
  await $`git commit -m "Version docs to ${nextDocsVersion}"`
  await cd('../')
}

async function updatePackageVersions({ nextRelease }: Pick<ReleaseOptions, 'nextRelease'>) {
  const lernaVersion = nextRelease.replace('v', '')
  // TODO(jtoar): Is this missing a peer dep?
  // See docs on these options at https://github.com/lerna/lerna/tree/main/libs/commands/version#options.
  await $`yarn lerna version ${lernaVersion} --no-git-tag-version --no-push --force-publish --exact --yes`

  for (const templatePath of ['packages/create-redwood-app/templates/ts', 'packages/create-redwood-app/templates/js', '__fixtures__/test-project']) {
    await updateRedwoodJsDependencyVersions(path.join(templatePath, 'package.json'), lernaVersion)
    await updateRedwoodJsDependencyVersions(path.join(templatePath, 'api', 'package.json'), lernaVersion)
    await updateRedwoodJsDependencyVersions(path.join(templatePath, 'web', 'package.json'), lernaVersion)
  }

  await $`yarn install`
  await $`git commit -am "chore: update package versions to ${nextRelease}"`
}

/** Iterates over `@redwoodjs/*` dependencies in a package.json and updates their version */
async function updateRedwoodJsDependencyVersions(packageConfigPath: string, version: string) {
  const packageConfig = await fs.readJson(packageConfigPath)

  for (const dep of Object.keys(packageConfig.dependencies ?? {}).filter(isRedwoodJsPackage)) {
    packageConfig.dependencies[dep] = version
  }
  for (const dep of Object.keys(packageConfig.devDependencies ?? {}).filter(isRedwoodJsPackage)) {
    packageConfig.devDependencies[dep] = version
  }
  for (const dep of Object.keys(packageConfig.peerDependencies ?? {}).filter(isRedwoodJsPackage)) {
    packageConfig.peerDependencies[dep] = version
  }

  fs.writeJson(packageConfigPath, packageConfig, { spaces: 2 })
}

const isRedwoodJsPackage = (pkg: string) => pkg.startsWith('@redwoodjs/')

async function removeCreateRedwoodAppFromWorkspaces() {
  const frameworkPackageConfig = await fs.readJson('./package.json')
  const packagePaths = (await $`yarn workspaces list --json`).stdout
    .trim()
    .split('\n')
    .map(JSON.parse)
    .filter(({ name }) => name)
    .map(({ location }) => location)

  frameworkPackageConfig.workspaces = packagePaths.filter(
    (packagePath) => packagePath !== 'packages/create-redwood-app'
  )
  fs.writeJson('./package.json', frameworkPackageConfig, {
    spaces: 2,
  })
  await $`git commit -am "chore: temporary update to workspaces"`

  return () => $`git reset --hard HEAD~1`
}

async function publish() {
  try {
    await execaCommand('yarn lerna publish from-package', { stdio: 'inherit' })
  } catch {
    await question([
      '✋ Publishing failed. You can usually recover from this by...',
      '',
      "1. Getting rid of the changes to the package.json's (lerna will make them again)",
      "2. In another terminal, running `yarn lerna publish from-package`",
      '',
      'Press anything to continue...'
    ].join('\n'))
  }
}

async function updateCreateRedwoodAppTemplates() {
  const originalCwd = process.cwd()
  cd('./packages/create-redwood-app/templates/ts')
  await $`rm -f yarn.lock`
  await $`touch yarn.lock`
  await $`yarn install`
  cd('../..')
  await $`yarn ts-to-js`
  await $`git add .`
  await $`git commit -m "chore: update create-redwood-app templates"`
  cd(originalCwd)
}

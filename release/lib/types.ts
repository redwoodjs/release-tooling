import type { ReleaseType } from 'semver'

export interface ReleaseOptions {
  latestRelease: string
  nextRelease: string
  desiredSemver: ReleaseType
  remote: string
}

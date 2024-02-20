import type { ReleaseType } from 'semver'

export interface ReleaseOptions {
  latestRelease: string
  nextRelease: string
  desiredSemver: ReleaseType
}

export interface PR {
  id: string
  number: number
  title: string
  url: string
  mergeCommit: {
    messageHeadline: string
  }
}

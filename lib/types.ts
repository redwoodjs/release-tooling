export interface Range {
  from: string
  to: string
}

export type CherryPickAnswer = 'yes' | 'no' | 'skip'

export type CommitType = 'commit' | 'ui' | 'tag' | 'release-chore' | 'revert'

export type TriageData = {
  line: string
  ref: string
  type: CommitType
  pretty: string
  hash: string
  author: string
  date: string
  needsCherryPick?: CherryPickAnswer | undefined
  message?: string | undefined
  pr?: string | undefined
  url?: string | undefined
  milestone?: string | undefined
  comment?: string | undefined
}

export type AnnotatedCommit = TriageData & {
  type: 'commit'
  message: string
}

export type CommitTriageData = Map<
  string,
  {
    message: string
    needsCherryPick: CherryPickAnswer
    comment?: string
  }
>

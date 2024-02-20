export interface Range {
  from: string
  to: string
}

export type Commit = {
  line: string;
  type: "commit" | "ui" | "tag" | "chore";
  ref: string;
  notes?: string;

  hash?: string;
  message?: string;

  pr?: string;
  url?: string;
  milestone?: string;
}

export type PrettyCommit = Commit & { pretty?: string }

export interface Range {
  from: string;
  to: string;
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
};

export type PrettyCommit = Commit & { pretty?: string };

export interface PR {
  id: string;
  number: number;
  title: string;
  url: string;
  mergeCommit: {
    messageHeadline: string;
  };
}

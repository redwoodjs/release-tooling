export const TRIAGE_DATA_PATH = new URL(
  `../../triage-data/`,
  import.meta.url
)

export const PR_MILESTONE_CACHE_PATH = new URL(
  './prMilestoneCache.json',
  TRIAGE_DATA_PATH
)

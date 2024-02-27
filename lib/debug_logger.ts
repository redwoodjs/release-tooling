export function debugLogger(arg: any) {
  if (process.env.REDWOOD_RELEASE_DEBUG) {
    console.dir(arg, { depth: null })
  }
}

import type { ProcessOutput } from 'zx'

/**
 * Helper for getting the trimmed stdout from `zx`'s `ProcessOutput`:
 *
 * ```ts
 * unwrap(await $`...`)
 * ```
 */
export function unwrap(processOutput: ProcessOutput) {
  return processOutput.stdout.trim()
}

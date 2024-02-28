import type { ProcessOutput } from 'zx'

/**
 * Helper for getting the trimmed stdout from `zx`'s `ProcessOutput`
 * 
 * @example
 *
 * ```ts
 * const stdout = unwrap(await $`...`)
 * ```
 */
export function unwrap(processOutput: ProcessOutput) {
  return processOutput.stdout.trim()
}

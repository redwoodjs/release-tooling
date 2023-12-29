import fs from 'node:fs'
import path from 'node:path'

export function isErrorWithCode(error: unknown): error is Error & { code: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof error.code === 'string'
  )
}

export function isErrorWithMessage(error: unknown): error is Error & { message: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof error.message === 'string'
  )
}

export function isErrorWithStatus(error: unknown): error is Error & { status: number } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    typeof error.status === 'number'
  )
}

/** Find a file by walking up parent directories */
export function findUp(file: string, startingDirectory = process.cwd()) {
  const possibleFilepath = path.join(startingDirectory, file)

  if (fs.existsSync(possibleFilepath)) {
    return possibleFilepath
  }

  const parentDirectory = path.dirname(startingDirectory)

  // If we've reached the root directory, there's no file to be found.
  if (parentDirectory === startingDirectory) {
    return null
  }

  return findUp(file, parentDirectory)
}

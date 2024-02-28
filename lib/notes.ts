import { $ } from 'zx'

/**
 * Fetches notes from the remote.
 * We use notes to document commits that we aren't cherry picking.
 * 
 * See https://stackoverflow.com/questions/18268986/git-how-to-push-messages-added-by-git-notes-to-the-central-git-server.
 */
export async function fetchNotes(remote: string) {
  await $`git fetch ${remote} 'refs/notes/*:refs/notes/*'`
}

export async function pushNotes(remote: string) {
  await $`git push ${remote} 'refs/notes/*'`
}

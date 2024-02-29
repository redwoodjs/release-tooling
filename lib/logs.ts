import { fs } from "zx";

export const logs: any[] = []

export function setUpLogs(file: URL) {
  process.on('exit', () => {
    if (logs.length === 0) {
      return
    }

    fs.writeJsonSync(file, logs, { spaces: 2})
  })
}

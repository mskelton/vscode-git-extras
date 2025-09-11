import * as vscode from 'vscode'
import { spawnAsync } from './spawnAsync'

export interface GitOptions {
  cwd?: string
}

export async function git(args: string[], options: GitOptions = {}): Promise<string> {
  const { cwd = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath } = options

  if (!cwd) {
    throw new Error('No workspace folder open')
  }

  const { stderr, stdout } = await spawnAsync('git', args, { cwd })
  if (stderr && !stderr.includes('warning:')) {
    throw new Error(stderr)
  }
  return stdout
}

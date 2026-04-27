import * as path from 'node:path'
import * as vscode from 'vscode'
import { Git } from './git'

interface RemoteConfig {
  blame: string
  file: string
  regex: string
  repo: string
}

/* eslint-disable no-template-curly-in-string */
const DEFAULT_REMOTES: RemoteConfig[] = [
  {
    blame: 'https://github.com/${1}/blame/${sha}/${file}${line}',
    file: 'https://github.com/${1}/blob/${sha}/${file}${line}',
    regex: '^git@github\\.com:(.+?)(?:\\.git)?$',
    repo: 'https://github.com/${1}',
  },
  {
    blame: 'https://github.com/${1}/blame/${sha}/${file}${line}',
    file: 'https://github.com/${1}/blob/${sha}/${file}${line}',
    regex: '^https?://github\\.com/(.+?)(?:\\.git)?/?$',
    repo: 'https://github.com/${1}',
  },
]
/* eslint-enable no-template-curly-in-string */

export async function buildFileUrl(git: Git, kind: 'blame' | 'file'): Promise<string> {
  const editor = vscode.window.activeTextEditor
  if (!editor) {
    throw new Error('No file is open')
  }

  const { config, match } = await resolveRemote(git)
  const sha = await git.getOutput(['rev-parse', 'HEAD'])
  const repoRoot = await git.getOutput(['rev-parse', '--show-toplevel'])
  const filePath = path.relative(repoRoot, editor.document.uri.fsPath).split(path.sep).join('/')

  return applyTemplate(kind === 'blame' ? config.blame : config.file, match, {
    file: filePath,
    line: formatLineFragment(editor.selection),
    sha,
  })
}

export async function buildRepoUrl(git: Git): Promise<string> {
  const { config, match } = await resolveRemote(git)
  return applyTemplate(config.repo, match, {})
}

async function resolveRemote(git: Git): Promise<{
  config: RemoteConfig
  match: RegExpMatchArray
}> {
  const remoteUrl = await git.getOutput(['remote', 'get-url', 'origin'])
  const userRemotes =
    vscode.workspace.getConfiguration('git-extras').get<RemoteConfig[]>('remotes') ?? []
  const remotes = [...userRemotes, ...DEFAULT_REMOTES]

  for (const config of remotes) {
    const match = remoteUrl.match(new RegExp(config.regex))
    if (match) {
      return { config, match }
    }
  }

  throw new Error(`No remote configuration matched: ${remoteUrl}`)
}

function formatLineFragment(selection: vscode.Selection): string {
  const start = selection.start.line + 1
  let end = selection.end.line + 1
  if (selection.end.character === 0 && end > start) {
    end -= 1
  }
  if (selection.isEmpty || start === end) {
    return `#L${start}`
  }
  return `#L${start}-L${end}`
}

function applyTemplate(
  template: string,
  match: RegExpMatchArray,
  vars: Record<string, string>,
): string {
  return template.replace(/\$\{([^}]+)\}/g, (_, key) => {
    if (/^\d+$/.test(key)) {
      return match[Number(key)] ?? ''
    }
    return vars[key] ?? ''
  })
}

import * as path from 'node:path'
import * as vscode from 'vscode'
import { Git, GitError } from './git'
import { buildFileUrl, buildRepoUrl } from './remote'

export function activate(context: vscode.ExtensionContext) {
  const channel = vscode.window.createOutputChannel('Git Extras', { log: true })
  context.subscriptions.push(channel)

  const git = new Git(channel)

  context.subscriptions.push(
    vscode.commands.registerCommand('git-extras.checkout-default-branch', async () => {
      await withProgress('Checking out default branch…', async () => {
        await checkoutDefault(git)
      })
    }),
    vscode.commands.registerCommand('git-extras.checkout-file-from-default-branch', async () => {
      const editor = vscode.window.activeTextEditor
      if (!editor) {
        throw new Error('No file is open')
      }

      const repoRoot = await git.getOutput(['rev-parse', '--show-toplevel'])
      const filePath = path.relative(repoRoot, editor.document.uri.fsPath).split(path.sep).join('/')
      const defaultBranch = await git.getOutput(['default'])

      await withProgress(`Checking out ${filePath} from ${defaultBranch}…`, async () => {
        await git.run(['checkout', defaultBranch, '--', filePath])
      })
    }),
    vscode.commands.registerCommand('git-extras.push', async () => {
      await withProgress('Pushing changes…', async () => {
        await git.run(['push'])
      })
    }),
    vscode.commands.registerCommand('git-extras.pull', async () => {
      await withProgress('Pulling changes…', async () => {
        await git.run(['pull'])
      })
    }),
    vscode.commands.registerCommand('git-extras.append', async () => {
      await withProgress('Amending last commit…', async () => {
        await git.run(['add', '-A'])
        await git.run(['commit', '--amend', '--no-edit'])
      })
    }),
    vscode.commands.registerCommand('git-extras.sync', async () => {
      await git.run(['add', '-A'])

      try {
        await git.run(['commit', '-m', 'Sync'])
      } catch (error) {
        if (
          error instanceof GitError &&
          error.output.includes('nothing to commit, working tree clea')
        ) {
          vscode.window.showInformationMessage('No changes to commit')
          return
        }

        throw error
      }

      await withProgress('Syncing changes…', async () => {
        await git.run(['push'])
      })
    }),
    vscode.commands.registerCommand('git-extras.copy-remote-url', async () => {
      const url = vscode.window.activeTextEditor
        ? await buildFileUrl(git, 'file')
        : await buildRepoUrl(git)

      await vscode.env.clipboard.writeText(url)
      vscode.window.showInformationMessage('Copied URL to clipboard')
    }),
    vscode.commands.registerCommand('git-extras.open-blame', async () => {
      const url = await buildFileUrl(git, 'blame')
      await vscode.env.openExternal(vscode.Uri.parse(url))
    }),
    vscode.commands.registerCommand('git-extras.push-force-with-lease', async () => {
      const result = await vscode.window.showWarningMessage(
        'Are you sure you want to force push?',
        { modal: true },
        'Yes',
      )

      if (result !== 'Yes') {
        return
      }

      await withProgress('Force pushing…', async () => {
        await git.run(['push', '--force-with-lease'])
      })
    }),
  )
}

export function deactivate() {}

type Progress = vscode.Progress<{ increment: number; message: string }>

function withProgress(title: string, task: (options: { progress: Progress }) => Promise<void>) {
  return vscode.window.withProgress(
    {
      cancellable: false,
      location: vscode.ProgressLocation.Notification,
      title,
    },
    (progress) => task({ progress }),
  )
}

async function checkoutDefault(git: Git) {
  const cwd = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath
  if (!cwd) {
    throw new Error('No workspace folder open')
  }

  // Get the default branch
  const defaultBranch = await git.getOutput(['default'])

  // Check if we're in a worktree
  const gitCommonDir = await git.getOutput(['rev-parse', '--git-common-dir'])
  const gitDir = await git.getOutput(['rev-parse', '--git-dir'])

  if (gitCommonDir !== gitDir) {
    // We're in a worktree
    const dirName = path.basename(cwd)
    const worktreeBranch = dirName.replace(/^web-/, '')

    // Check if branch exists
    try {
      await git.getOutput(['show-ref', '--verify', '--quiet', `refs/heads/${worktreeBranch}`])
      // Branch exists, rebase on default branch
      await git.run(['rebase', defaultBranch, worktreeBranch])
    } catch {
      // Branch doesn't exist, create new branch from default
      await git.run(['checkout', '-b', worktreeBranch, defaultBranch])
    }
  } else {
    // Not in a worktree, just checkout default branch
    await git.run(['checkout', defaultBranch])
  }
}

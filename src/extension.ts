import * as vscode from 'vscode'
import { Git } from './git'

export function activate(context: vscode.ExtensionContext) {
  const channel = vscode.window.createOutputChannel('Git Extras', { log: true })
  context.subscriptions.push(channel)

  const git = new Git(channel)

  context.subscriptions.push(
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
      await withProgress('Syncing changes…', async () => {
        await git.run(['add', '-A'])
        await git.run(['commit', '-m', 'Sync'])
        await git.run(['push'])
      })
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

function withProgress(title: string, callback: () => Promise<void>) {
  return vscode.window.withProgress(
    {
      cancellable: false,
      location: vscode.ProgressLocation.Notification,
      title,
    },
    callback,
  )
}

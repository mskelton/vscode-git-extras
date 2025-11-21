import { spawn } from 'node:child_process'
import { createInterface } from 'node:readline'
import { PassThrough, Readable } from 'node:stream'
import * as vscode from 'vscode'

export interface GitOptions {
  cwd?: string
}

export class GitError extends Error {
  output: string

  constructor(message: string, options: { output: string }) {
    super(message)
    this.output = options.output
  }
}

export class Git {
  constructor(private readonly channel: vscode.LogOutputChannel) {}

  async run(args: string[], options: GitOptions = {}): Promise<void> {
    const { cwd = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath } = options

    if (!cwd) {
      throw new Error('No workspace folder open')
    }

    return new Promise<void>((resolve, reject) => {
      this.channel.info(`Running "git ${args.join(' ')}" in ${cwd}`)

      const child = spawn('git', args, {
        cwd,
        stdio: ['ignore', 'pipe', 'pipe'],
      })

      const interleaved = new PassThrough()
      const errorStream = new PassThrough()

      child.stdout?.pipe(interleaved)
      child.stderr?.pipe(interleaved)

      interleaved.pipe(errorStream)

      const rl = createInterface({ input: interleaved })

      rl.on('line', (line) => {
        this.channel.info(line)
      })

      child.on('close', (code) => {
        if (code === 0) {
          resolve()
        } else {
          getStream(errorStream)
            .then((output) => reject(new GitError(`Process exited with code ${code}`, { output })))
            .catch(reject)
        }
      })
    })
  }

  async getOutput(args: string[], options: GitOptions = {}): Promise<string> {
    const { cwd = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath } = options

    if (!cwd) {
      throw new Error('No workspace folder open')
    }

    return new Promise<string>((resolve, reject) => {
      this.channel.info(`Running "git ${args.join(' ')}" in ${cwd}`)

      const child = spawn('git', args, {
        cwd,
        stdio: ['ignore', 'pipe', 'pipe'],
      })

      let stdout = ''
      let stderr = ''

      child.stdout?.on('data', (data) => {
        stdout += data.toString()
      })

      child.stderr?.on('data', (data) => {
        stderr += data.toString()
      })

      child.on('close', (code) => {
        if (stderr) {
          this.channel.info(stderr)
        }

        if (code === 0) {
          resolve(stdout.trim())
        } else {
          reject(new Error(`Process exited with code ${code}`))
        }
      })
    })
  }
}

function getStream(stream: Readable): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const data: Buffer[] = []

    stream.on('data', (chunk) => {
      data.push(chunk)
    })

    stream.on('end', () => {
      resolve(data.join(''))
    })

    stream.on('error', (error) => {
      reject(error)
    })
  })
}

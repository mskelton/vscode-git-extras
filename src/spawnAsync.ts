import { spawn, SpawnOptionsWithStdioTuple, StdioPipe } from 'child_process'

export function spawnAsync(
  command: string,
  args: string[],
  options?: Omit<SpawnOptionsWithStdioTuple<StdioPipe, StdioPipe, StdioPipe>, 'stdio'>,
) {
  return new Promise<{ stderr: string; stdout: string }>((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      ...options,
    })

    let stdout = ''
    let stderr = ''

    child.stdout?.on('data', (chunk) => (stdout += chunk))
    child.stderr?.on('data', (chunk) => (stderr += chunk))

    child.on('close', (code) => {
      if (code === 0) {
        resolve({ stderr, stdout })
      } else {
        reject(new Error(`Process exited with code ${code}`))
      }
    })
  })
}

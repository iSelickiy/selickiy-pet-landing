import Docker from 'dockerode'
import { HttpError } from './lib.js'

const docker = new Docker({ socketPath: '/var/run/docker.sock' })
const image = 'denoland/deno@sha256:a0d88a7fcbd44f062cba2748e19df67d30290ad12aa203c7c1e0b12462c483f0'
const network = 'obsidian-sync_internal'

async function ensureImage() {
  try {
    await docker.getImage(image).inspect()
    return
  } catch { /* pull below */ }
  const stream = await docker.pull(image)
  await new Promise((resolve, reject) => {
    docker.modem.followProgress(stream, (error, result) => error ? reject(error) : resolve(result))
  })
}

export async function runDeno(scriptUrl, environment) {
  await ensureImage()
  const container = await docker.createContainer({
    Image: image,
    Cmd: ['run', '--minimum-dependency-age=0', '--allow-env', '--allow-net', scriptUrl],
    Env: Object.entries(environment).map(([key, value]) => `${key}=${value}`),
    Labels: { 'bigvps.control-plane': 'obsidian-livesync' },
    Tty: true,
    HostConfig: { NetworkMode: network, AutoRemove: false },
  })
  let timer
  try {
    await container.start()
    const status = await Promise.race([
      container.wait(),
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new HttpError(504, 'Превышено время запуска LiveSync utility', 'DENO_TIMEOUT')), 120000)
      }),
    ])
    const output = (await container.logs({ stdout: true, stderr: true })).toString('utf8')
    if (status.StatusCode !== 0) {
      throw new HttpError(502, `LiveSync utility завершилась с кодом ${status.StatusCode}`, 'DENO_FAILED')
    }
    return output
  } finally {
    if (timer) clearTimeout(timer)
    await container.remove({ force: true }).catch(() => {})
  }
}

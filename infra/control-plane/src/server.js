import express from 'express'
import Docker from 'dockerode'
import fs from 'node:fs/promises'
import os from 'node:os'
import { listVaults } from './couchdb.js'
import { createVault } from './vaults.js'
import { assertContainerAction, HttpError, tokensMatch } from './lib.js'

const required = ['CONTROL_PLANE_TOKEN', 'COUCHDB_ADMIN_USER', 'COUCHDB_ADMIN_PASSWORD']
for (const name of required) {
  if (!process.env[name]) throw new Error(`${name} is required`)
}

const app = express()
const docker = new Docker({ socketPath: '/var/run/docker.sock' })
const port = Number(process.env.PORT || 3100)
app.disable('x-powered-by')
app.use(express.json({ limit: '16kb' }))
app.use((_request, response, next) => {
  response.set('Cache-Control', 'no-store')
  next()
})
app.get('/health', (_request, response) => response.json({ status: 'ok' }))
app.use('/v1', (request, response, next) => {
  const token = request.get('authorization')?.replace(/^Bearer /, '')
  if (!tokensMatch(token, process.env.CONTROL_PLANE_TOKEN)) {
    return response.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Неверный сервисный токен' } })
  }
  next()
})

const asyncRoute = (handler) => async (request, response, next) => {
  try { await handler(request, response) } catch (error) { next(error) }
}

app.get('/v1/vaults', asyncRoute(async (_request, response) => {
  response.json({ vaults: await listVaults() })
}))

app.post('/v1/vaults', asyncRoute(async (request, response) => {
  response.status(201).json({ vault: await createVault(request.body?.slug) })
}))

app.get('/v1/server', asyncRoute(async (_request, response) => {
  const [containers, disk] = await Promise.all([
    docker.listContainers({ all: true }),
    fs.statfs('/opt/bigvps'),
  ])
  const totalMemory = os.totalmem()
  const freeMemory = os.freemem()
  const totalDisk = Number(disk.blocks) * Number(disk.bsize)
  const freeDisk = Number(disk.bavail) * Number(disk.bsize)
  response.json({
    resources: {
      memory: { total: totalMemory, used: totalMemory - freeMemory },
      disk: { total: totalDisk, used: totalDisk - freeDisk },
    },
    services: containers.map((container) => ({
      name: container.Names[0]?.replace(/^\//, '') || container.Id.slice(0, 12),
      image: container.Image,
      state: container.State,
      status: container.Status,
    })).sort((left, right) => left.name.localeCompare(right.name)),
  })
}))

app.post('/v1/containers/:name/actions', asyncRoute(async (request, response) => {
  const name = request.params.name
  const action = request.body?.action
  assertContainerAction(name, action)
  const container = docker.getContainer(name)
  await container.inspect()
  if (action === 'start') await container.start()
  if (action === 'stop') await container.stop({ t: 10 })
  if (action === 'restart') await container.restart({ t: 10 })
  response.json({ success: true, name, action })
}))

app.use((error, _request, response, _next) => {
  void _next
  const status = error instanceof HttpError ? error.status : 500
  const message = status === 500 ? 'Внутренняя ошибка control-plane' : error.message
  if (status === 500) console.error(error)
  response.status(status).json({ error: { code: error.code || 'INTERNAL_ERROR', message } })
})

app.listen(port, '0.0.0.0', () => {
  console.log(`BIGVPS control-plane listening on ${port}`)
})

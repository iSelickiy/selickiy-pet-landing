import { createHmac, timingSafeEqual } from 'node:crypto'
import { spawn } from 'node:child_process'
import http from 'node:http'

const secret = process.env.WEBHOOK_SECRET?.trim()
if (!secret) throw new Error('WEBHOOK_SECRET is required')

const host = '127.0.0.1'
const port = Number(process.env.WEBHOOK_PORT || 9000)
const maxBodyBytes = 256 * 1024
const deployScript = process.env.DEPLOY_SCRIPT || '/var/www/portfolio/infra/deploy.sh'
let deployProcess = null

function log(message) { console.log(`[${new Date().toISOString()}] ${message}`) }
function send(response, status, body) {
  response.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' })
  response.end(body)
}
function hasValidSignature(body, header) {
  if (typeof header !== 'string' || !/^sha256=[a-f\d]{64}$/i.test(header)) return false
  const provided = Buffer.from(header.slice(7), 'hex')
  const expected = createHmac('sha256', secret).update(body).digest()
  return provided.length === expected.length && timingSafeEqual(provided, expected)
}

const server = http.createServer((request, response) => {
  if (request.method !== 'POST' || request.url !== '/deploy') return send(response, 404, 'Not found')
  if (request.headers['x-github-event'] !== 'push') return send(response, 202, 'Ignored event')

  const chunks = []
  let size = 0
  request.on('data', (chunk) => {
    size += chunk.length
    if (size > maxBodyBytes) {
      send(response, 413, 'Payload too large')
      request.destroy()
      return
    }
    chunks.push(chunk)
  })
  request.on('end', () => {
    if (response.writableEnded) return
    const body = Buffer.concat(chunks)
    if (!hasValidSignature(body, request.headers['x-hub-signature-256'])) {
      log('Rejected request with invalid or missing signature')
      return send(response, 403, 'Invalid signature')
    }

    let payload
    try { payload = JSON.parse(body.toString('utf8')) } catch { return send(response, 400, 'Invalid JSON') }
    if (payload.ref !== 'refs/heads/main') return send(response, 202, 'Ignored branch')
    if (deployProcess) return send(response, 409, 'Deploy already running')

    deployProcess = spawn(deployScript, [], { stdio: ['ignore', 'pipe', 'pipe'] })
    deployProcess.stdout.on('data', (chunk) => process.stdout.write(chunk))
    deployProcess.stderr.on('data', (chunk) => process.stderr.write(chunk))
    deployProcess.on('close', (code) => { log(`Deploy finished with exit code ${code}`); deployProcess = null })
    deployProcess.on('error', (error) => { log(`Deploy failed to start: ${error.message}`); deployProcess = null })
    log('Accepted signed push to main')
    return send(response, 202, 'Deploy started')
  })
  request.on('error', (error) => log(`Request error: ${error.message}`))
})

server.headersTimeout = 10_000
server.requestTimeout = 15_000
server.listen(port, host, () => log(`Webhook listening on http://${host}:${port}/deploy`))

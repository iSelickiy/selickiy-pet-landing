import { execFileSync } from 'node:child_process'

function run(command: string, args: string[]) {
  return execFileSync(command, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()
}

const host = process.env.DEPLOY_HOST || 'perslandos'
const remoteDir = process.env.DEPLOY_DIR || '/var/www/portfolio'
const local = run('git', ['rev-parse', 'HEAD'])
const github = run('git', ['ls-remote', 'origin', 'refs/heads/main']).split(/\s+/)[0]
const production = run('ssh', [host, `git -C ${remoteDir} rev-parse HEAD`])
const healthRaw = run('ssh', [host, 'curl -fsS http://127.0.0.1:3000/api/health'])
const health = JSON.parse(healthRaw) as { status?: string; database?: string; commit?: string }
const aligned = local === github && github === production && (health.commit === production || health.commit === 'unknown')

console.log(JSON.stringify({ aligned, local, github, production, health }, null, 2))
if (!aligned || health.status !== 'ok' || health.database !== 'ok') process.exitCode = 1

const http = require('http');
const { spawn } = require('child_process');
const crypto = require('crypto');

const SECRET = 'portfolio-webhook-secret-2026';
const PORT = 9000;
let deployProcess = null;

function log(message) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

const server = http.createServer((req, res) => {
  if (req.method !== 'POST' || req.url !== '/deploy') {
    res.writeHead(404);
    res.end('Not found');
    return;
  }

  let body = '';
  req.on('data', chunk => {
    body += chunk;
  });

  req.on('end', () => {
    const sig = req.headers['x-hub-signature-256'];
    if (sig) {
      const hmac = crypto.createHmac('sha256', SECRET);
      hmac.update(body);
      const expected = 'sha256=' + hmac.digest('hex');
      if (sig !== expected) {
        log('Invalid signature');
        res.writeHead(403);
        res.end('Invalid signature');
        return;
      }
    }

    let payload;
    try {
      payload = JSON.parse(body);
    } catch (error) {
      log(`Invalid JSON payload: ${error.message}`);
      res.writeHead(400);
      res.end('Invalid JSON');
      return;
    }

    if (payload.ref !== 'refs/heads/main') {
      res.writeHead(200);
      res.end('Not main branch, skipping');
      return;
    }

    if (deployProcess) {
      log('Deploy request ignored because another deploy is already running');
      res.writeHead(409);
      res.end('Deploy already running');
      return;
    }

    log('Push to main detected, deploying...');
    res.writeHead(200);
    res.end('Deploying...');

    deployProcess = spawn('/var/www/deploy.sh', [], {
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    deployProcess.stdout.on('data', chunk => {
      process.stdout.write(chunk);
    });

    deployProcess.stderr.on('data', chunk => {
      process.stderr.write(chunk);
    });

    deployProcess.on('close', code => {
      log(`Deploy finished with exit code ${code}`);
      deployProcess = null;
    });

    deployProcess.on('error', error => {
      log(`Deploy process failed to start: ${error.message}`);
      deployProcess = null;
    });
  });
});

server.listen(PORT, () => {
  log(`Webhook server listening on port ${PORT}`);
});

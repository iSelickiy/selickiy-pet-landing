# Production Maintenance

## Current Infra Snapshot

- App checkout: `/var/www/portfolio`
- Deploy script: `/var/www/deploy.sh`
- Webhook listener: `/var/www/webhook.js`
- Runtime HTML storage: `/var/www/storage/custom-pages`
- Swap: `1G` at `/swapfile`

## Prisma

Production currently keeps PostgreSQL-specific versions of:

- `prisma/schema.prisma`
- `src/lib/prisma.ts`
- `prisma/seed.ts`

The deploy script backs them up before `git reset --hard origin/main`, then restores them and runs:

```bash
npm install --production=false
npx prisma generate
npx prisma migrate deploy
npm run build
systemctl restart portfolio.service
```

## Deploy Safeguards

Production deploy now has extra protections because the server has only `1 CPU / 1 GB RAM`:

- `webhook.js` uses `spawn(...)` instead of `execFile(...)`, so deploy output is streamed to journald instead of buffered in webhook process memory
- only one deploy can run at a time
- `deploy.sh` takes an exclusive lock via `flock`
- before `next build`, the current `.next` is copied to a temporary backup
- if build fails, `deploy.sh` restores the previous `.next` so a reboot does not leave the app without a production build
- build runs with `NODE_OPTIONS=--max-old-space-size=512` to reduce memory spikes

## Incident Note: 2026-04-04

Observed failure mode:

- `webhook.service` was killed by the Linux OOM killer during deploy
- `.next` was left in a partial state
- after server reboot, `portfolio.service` could not start because Next.js could not find a valid production build

Main symptoms in logs:

- missing SSR chunk files under `.next/server/chunks/ssr`
- missing `.next/prerender-manifest.json`
- `Could not find a production build in the '.next' directory`

Immediate recovery steps that worked:

1. move the broken `.next` aside
2. run `npm run build` manually
3. restart `portfolio.service`
4. verify `localhost:3000` and `https://selickiy.space`

## Runtime Storage

- Custom HTML pages live in `CUSTOM_PAGES_DIR`
- Current production path: `/var/www/storage/custom-pages`
- This directory must stay outside the git checkout

## Cleanup Rules

- Files matching `._*` are junk macOS metadata files and can be safely removed from `/var/www/portfolio`
- Do not delete runtime storage, `.env`, or PostgreSQL-specific Prisma files as part of generic cleanup

## Verification Checklist

After deploy or cleanup, verify:

1. `systemctl is-active portfolio.service`
2. `systemctl is-active webhook.service`
3. `curl -I http://127.0.0.1:3000`
4. `curl -I https://selickiy.space`
5. `npx prisma migrate deploy` succeeds
6. `https://selickiy.space/admin/custom-pages` redirects to `/admin/login`
7. `https://selickiy.space/custom/<missing-slug>` returns `404`

If the site fails after deploy:

1. inspect `journalctl -u portfolio.service -n 100 --no-pager`
2. inspect `journalctl -u webhook.service -n 100 --no-pager`
3. check whether `.next` is incomplete or missing key manifests
4. if needed, rebuild manually in `/var/www/portfolio` and restart `portfolio.service`

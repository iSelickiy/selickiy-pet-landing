# Production Maintenance

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
2. `npx prisma migrate deploy` succeeds
3. `https://selickiy.space/admin/custom-pages` redirects to `/admin/login`
4. `https://selickiy.space/custom/<missing-slug>` returns `404`

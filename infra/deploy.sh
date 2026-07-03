#!/bin/bash
set -Eeuo pipefail

exec 9>/var/www/portfolio-deploy.lock
if ! flock -n 9; then
  echo "[$(date)] Deploy skipped: another deploy is already running."
  exit 1
fi

cd /var/www/portfolio

echo "[$(date)] Deploy started..."

backup_dir=$(mktemp -d /tmp/portfolio-deploy.XXXXXX)
next_backup=""
restore_next_on_error=0

cleanup() {
  local exit_code=$?

  if [ "$exit_code" -ne 0 ] && [ "$restore_next_on_error" -eq 1 ] && [ -n "$next_backup" ] && [ -d "$next_backup" ]; then
    echo "[$(date)] Deploy failed, restoring previous .next build..."
    rm -rf .next
    mv "$next_backup" .next
  fi

  rm -rf "$backup_dir"
}
trap cleanup EXIT

cp src/lib/prisma.ts "$backup_dir/prisma.ts"
cp prisma/seed.ts "$backup_dir/seed.ts"
cp prisma/schema.prisma "$backup_dir/schema.prisma"

find . -name '._*' -delete
rm -f prisma/schema.prisma.bak-custom-pages

git checkout -- prisma/schema.prisma src/lib/prisma.ts prisma/seed.ts || true
git fetch origin
git reset --hard origin/main

cp "$backup_dir/prisma.ts" src/lib/prisma.ts
cp "$backup_dir/seed.ts" prisma/seed.ts
cp "$backup_dir/schema.prisma" prisma/schema.prisma

npm install --production=false
npx prisma generate
npx prisma migrate deploy

if [ -d .next ]; then
  next_backup="/tmp/portfolio-next-backup-$(date +%Y%m%d-%H%M%S)"
  rm -rf "$next_backup"
  cp -a .next "$next_backup"
  restore_next_on_error=1
fi

NODE_OPTIONS="--max-old-space-size=512" npm run build

prisma_aliases=$(grep -RhoE '@prisma/client-[a-z0-9]+' .next 2>/dev/null | sort -u || true)
for alias in $prisma_aliases; do
  alias_dir="node_modules/@prisma/${alias#@prisma/}"
  ln -sfn client "$alias_dir"
done

systemctl restart portfolio.service
systemctl is-active --quiet portfolio.service

if [ -n "$next_backup" ] && [ -d "$next_backup" ]; then
  rm -rf "$next_backup"
fi

echo "[$(date)] Deploy completed!"

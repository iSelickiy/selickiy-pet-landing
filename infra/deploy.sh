#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR=${APP_DIR:-/var/www/portfolio}
STATE_DIR=${STATE_DIR:-/var/lib/portfolio}
RELEASE_ENV=${RELEASE_ENV:-$STATE_DIR/release.env}
UPLOADS_DIR=${UPLOADS_DIR:-$STATE_DIR/uploads}
CUSTOM_PAGES_DIR=${CUSTOM_PAGES_DIR:-$STATE_DIR/custom-pages}

exec 9>"$STATE_DIR/deploy.lock"
flock -n 9 || { echo "[$(date --iso-8601=seconds)] Another deploy is running"; exit 1; }

cd "$APP_DIR"
old_sha=$(git rev-parse HEAD)
next_backup=""

rollback() {
  code=$?
  if [ "$code" -ne 0 ] && [ -n "$next_backup" ] && [ -d "$next_backup" ]; then
    echo "[$(date --iso-8601=seconds)] Restoring previous .next build"
    rm -rf "$APP_DIR/.next"
    mv "$next_backup" "$APP_DIR/.next"
  fi
  exit "$code"
}
trap rollback EXIT

echo "[$(date --iso-8601=seconds)] Pre-deploy backup from $old_sha"
"$APP_DIR/infra/backup.sh"

git fetch --prune origin
git reset --hard origin/main
find "$APP_DIR" -name '._*' -delete

install -d -m 0750 "$UPLOADS_DIR" "$CUSTOM_PAGES_DIR"
if [ -d "$APP_DIR/public/uploads" ]; then
  cp -an "$APP_DIR/public/uploads/." "$UPLOADS_DIR/"
fi

npm ci
npm run prisma:generate
npm run lint
npm run typecheck
npm run test

if [ -d .next ]; then
  next_backup="$STATE_DIR/.next-rollback-$(date +%Y%m%d%H%M%S)"
  cp -a .next "$next_backup"
fi

new_sha=$(git rev-parse HEAD)
built_at=$(date --iso-8601=seconds)
APP_GIT_SHA="$new_sha" APP_BUILT_AT="$built_at" NODE_OPTIONS="--max-old-space-size=768" npm run build
npm run db:migrate

umask 077
{
  printf 'APP_GIT_SHA=%s\n' "$new_sha"
  printf 'APP_BUILT_AT=%s\n' "$built_at"
  printf 'UPLOADS_DIR=%s\n' "$UPLOADS_DIR"
  printf 'CUSTOM_PAGES_DIR=%s\n' "$CUSTOM_PAGES_DIR"
} > "$RELEASE_ENV"

sudo -n systemctl restart portfolio.service
sudo -n systemctl is-active portfolio.service >/dev/null
curl --fail --silent --show-error --retry 5 --retry-delay 2 http://127.0.0.1:3000/api/health

if [ -n "$next_backup" ]; then rm -rf "$next_backup"; fi
trap - EXIT
echo "[$(date --iso-8601=seconds)] Deploy complete: $new_sha"

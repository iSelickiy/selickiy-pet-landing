#!/usr/bin/env bash
set -Eeuo pipefail

STATE_DIR=${STATE_DIR:-/var/lib/portfolio}
BACKUP_DIR=${BACKUP_DIR:-$STATE_DIR/backups}
UPLOADS_DIR=${UPLOADS_DIR:-$STATE_DIR/uploads}
CUSTOM_PAGES_DIR=${CUSTOM_PAGES_DIR:-$STATE_DIR/custom-pages}
RETENTION_DAYS=${BACKUP_RETENTION_DAYS:-14}
timestamp=$(date +%Y%m%d-%H%M%S)
target="$BACKUP_DIR/$timestamp"

: "${DATABASE_URL:?DATABASE_URL is required}"
install -d -m 0750 "$target"

pg_dump --format=custom --file="$target/postgresql.dump" "$DATABASE_URL"
pg_restore --list "$target/postgresql.dump" >/dev/null

for source in "$UPLOADS_DIR" "$CUSTOM_PAGES_DIR"; do
  name=$(basename "$source")
  if [ -d "$source" ]; then
    tar -C "$(dirname "$source")" -czf "$target/$name.tar.gz" "$name"
  else
    tar -C "$target" -czf "$target/$name.tar.gz" --files-from /dev/null
  fi
  gzip -t "$target/$name.tar.gz"
  tar -tzf "$target/$name.tar.gz" >/dev/null
done

sha256sum "$target"/* > "$target/SHA256SUMS"
find "$BACKUP_DIR" -mindepth 1 -maxdepth 1 -type d -mtime "+$RETENTION_DAYS" -exec rm -rf {} +
echo "Backup verified: $target"

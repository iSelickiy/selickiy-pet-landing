# Production Maintenance

## Ежедневно автоматически

`portfolio-backup.timer` запускает `infra/backup.sh`. Каждый backup содержит:

- `postgresql.dump` в custom формате;
- `uploads.tar.gz`;
- `custom-pages.tar.gz`;
- `SHA256SUMS`.

Скрипт проверяет `pg_restore --list`, `gzip -t` и `tar -tzf`, затем удаляет локальные копии старше 14 дней.

## Еженедельно

```bash
systemctl list-timers portfolio-backup.timer
systemctl status portfolio-backup.service
find /var/lib/portfolio/backups -maxdepth 2 -type f -printf '%TY-%Tm-%Td %p\n' | tail
curl -fsS https://selickiy.space/api/health
```

Проверить свободное место, память/swap и отсутствие ошибок в journald.

## Ежемесячно

- тестово восстановить свежий PostgreSQL dump в отдельную БД;
- распаковать uploads/custom pages во временный каталог;
- проверить `certbot renew --dry-run`;
- проверить `npm audit --omit=dev --audit-level=high`;
- скопировать backup в offsite‑хранилище после его подключения.

## Восстановление

```bash
pg_restore --clean --if-exists --dbname="$DATABASE_URL" postgresql.dump
tar -xzf uploads.tar.gz -C /var/lib/portfolio
tar -xzf custom-pages.tar.gz -C /var/lib/portfolio
systemctl restart portfolio.service
curl -fsS http://127.0.0.1:3000/api/health
```

Перед восстановлением production всегда создать отдельный свежий backup.

## Runtime cleanup

- `._*` — мусор macOS, его можно удалять.
- Нельзя чистить `/var/lib/portfolio/uploads`, `/var/lib/portfolio/custom-pages`, backups или env‑файлы вместе с checkout.
- Orphan‑файлы не должны появляться: API компенсирует ошибки записи БД. При ручном cleanup сначала сверять записи `MediaFile`/`CustomPage`.

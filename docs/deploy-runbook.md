# Deploy Runbook

## Перед первым выпуском модернизации

1. До изменения service-файлов сделать ручной backup текущих PostgreSQL, uploads и custom pages. Проверить dump через `pg_restore --list`, архивы через `gzip -t` и сохранить текущие nginx/systemd-конфиги.

2. Создать пользователя, публичную группу uploads и каталоги:

```bash
sudo useradd --system --home /var/lib/portfolio --shell /usr/sbin/nologin portfolio
sudo groupadd --system portfolio-public
sudo usermod -aG portfolio-public portfolio
sudo usermod -aG portfolio-public www-data
sudo install -d -o portfolio -g portfolio -m 0750 /var/lib/portfolio/{uploads,custom-pages,backups}
sudo chgrp portfolio-public /var/lib/portfolio/uploads
sudo chmod 2750 /var/lib/portfolio/uploads
sudo chown -R portfolio:portfolio /var/www/portfolio
```

Setgid на uploads сохраняет группу `portfolio-public` для новых файлов: приложение может писать, nginx — только читать.

3. Установить env‑файлы по примерам из `infra/env/`:

- `/var/www/portfolio/.env`
- `/etc/portfolio/webhook.env` — новый ротированный `WEBHOOK_SECRET`
- `/etc/portfolio/backup.env`

4. Установить конфиги:

```bash
sudo cp infra/systemd/*.service infra/systemd/*.timer /etc/systemd/system/
sudo cp infra/nginx/selickiy.space.conf /etc/nginx/sites-enabled/portfolio
sudo cp infra/sudoers/portfolio /etc/sudoers.d/portfolio
sudo chmod 0440 /etc/sudoers.d/portfolio
sudo visudo -cf /etc/sudoers.d/portfolio
sudo nginx -t
sudo systemctl daemon-reload
```

5. Обновить GitHub webhook URL на `https://selickiy.space/deploy`, выбрать `application/json`, задать тот же новый secret и включить SSL verification.

6. Включить сервисы:

```bash
sudo systemctl enable --now portfolio.service webhook.service portfolio-backup.timer
```

Сервисы слушают только loopback. Проверить, что извне `3000` и `9000` недоступны; при необходимости дополнительно включить UFW только для 22/80/443.

## Обычный deploy

Push в `main` вызывает подписанный webhook. `infra/deploy.sh`:

1. берёт `flock`;
2. создаёт и проверяет backup;
3. синхронизирует checkout с `origin/main`;
4. выполняет `npm ci` и полный verify;
5. сохраняет предыдущую `.next`;
6. применяет обратно совместимые миграции;
7. собирает новую `.next` уже на актуальной схеме БД;
8. пишет commit и builtAt в `/var/lib/portfolio/release.env`;
9. рестартует только `portfolio.service`;
10. проверяет `/api/health`.

Пользователю `portfolio` через sudo разрешены только restart/status/is-active `portfolio.service`.

## Проверка

Локальная read-only сверка:

```bash
npm run verify:deployment
```

Ручной smoke на сервере:

```bash
curl -fsS http://127.0.0.1:3000/api/health
curl -I https://selickiy.space/
curl -I https://selickiy.space/admin/login
sudo systemctl is-active portfolio.service webhook.service portfolio-backup.timer
sudo ss -ltnp | grep -E ':(3000|9000)'
```

Ожидается `127.0.0.1:3000` и `127.0.0.1:9000`, не `0.0.0.0`.

## Rollback

При ошибке до restart deploy сам возвращает прежнюю `.next`. Миграции релиза должны оставаться обратно совместимыми.

Для ручного возврата кода сначала зафиксировать нужный commit в `main`, затем запустить новый deploy. Не восстанавливать старую схему БД поверх новых данных без отдельного плана восстановления.

## Логи

```bash
journalctl -u portfolio.service -n 150 --no-pager
journalctl -u webhook.service -n 150 --no-pager
journalctl -u portfolio-backup.service -n 150 --no-pager
```

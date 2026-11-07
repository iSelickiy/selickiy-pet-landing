# Deploy Runbook

## BIGVPS: Docker Compose и GitHub Actions

Целевая схема: сначала `staging.selickiy.space`, затем `selickiy.space` и `www.selickiy.space` на том же deployment. Next.js доступен только через существующий Traefik; PostgreSQL не публикует порт. `postgres_data`, `uploads` и `custom_pages` — named volumes проекта `selickiy-landing`.

### Требования на BIGVPS

- Docker Engine с Compose v2, `git`, `curl`, `tar` и OpenSSH.
- Внешняя Docker network `traefik`, HTTPS entrypoint `websecure` и resolver `letsencrypt`. Если имя entrypoint другое, задать его в `TRAEFIK_ENTRYPOINT`.
- DNS hostname на `103.228.169.198`; отдельные DNS-записи для apex и `www` перед production cutover.
- SSH-пользователь с доступом к Docker и правами на deploy-каталог. BIGVPS Admin этим deployment не используется.
- Git clone репозитория в `<DEPLOY_PATH>/repo`; workflow не перезаписывает и не удаляет рабочий checkout.
- Обратно совместимые Prisma-миграции: rollback возвращает код и образ, но не схему БД.

Одноразовая подготовка каталогов:

```bash
export DEPLOY_PATH=/srv/selickiy-landing
sudo install -d -o <ssh-user> -g <ssh-user> "$DEPLOY_PATH"
cd "$DEPLOY_PATH"
git clone <repository-url> repo
mkdir -p releases shared
cp repo/infra/env/bigvps.env.example shared/.env
chmod 600 shared/.env
docker network inspect traefik
```

Заполнить `shared/.env`. Пароль PostgreSQL в `POSTGRES_PASSWORD` и `DATABASE_URL` должен совпадать; в URL его нужно URL-encode. Учётные данные PostgreSQL применяются при первой инициализации пустого volume, поэтому смена env сама по себе не меняет пароль существующей БД.

### GitHub configuration

Создать Actions environment `bigvps` и следующие Secrets:

| Secret | Назначение |
|---|---|
| `BIGVPS_HOST` | `103.228.169.198` |
| `BIGVPS_USER` | SSH-пользователь |
| `BIGVPS_SSH_PORT` | SSH-порт; можно не задавать для `22` |
| `BIGVPS_DEPLOY_PATH` | Абсолютный путь, например `/srv/selickiy-landing` |
| `BIGVPS_SSH_KEY` | Приватный ключ отдельного deploy-ключа |
| `BIGVPS_SSH_HOST_KEY` | Готовая строка `known_hosts` с публичным host key сервера; для нестандартного порта использовать формат `[host]:port` |

Host key должен быть получен и проверен владельцем заранее. Workflow не использует небезопасный `StrictHostKeyChecking=no` и не выполняет доверенный `ssh-keyscan` во время deploy.

### Staging и production

1. В `shared/.env` оставить staging URL и ``TRAEFIK_RULE=Host(`staging.selickiy.space`)`` из примера.
2. Запустить первый deploy через **Actions → Deploy BIGVPS → Run workflow** с `sha=main`. Последующие успешные запуски CI для `main` вызывают deploy автоматически.
3. Проверить `https://staging.selickiy.space/api/health`, публичные страницы, загрузки и custom pages. OAuth на staging не входит в приёмку.
4. Для production перенести PostgreSQL, uploads и custom pages из старого VPS в те же named volumes во время разрешённого даунтайма. Это отдельная одноразовая операция; workflow данные не импортирует.
5. Обновить DNS, задать `NEXTAUTH_URL` и `NEXT_PUBLIC_SITE_URL` в `https://selickiy.space`, а ``TRAEFIK_RULE=Host(`selickiy.space`,`www.selickiy.space`)``. Запустить workflow вручную с `sha=main`, чтобы пересобрать public env и обновить Traefik labels.
6. Проверить HTTPS health на apex и `www`, затем production login/OAuth и admin mutations. После cutover отключать старый VPS отдельно; этот runbook его не меняет.

Постоянные внешние backups, S3 и Restic в BIGVPS deployment не добавляются.

### Что делает deploy

Каждый запуск создаёт `<DEPLOY_PATH>/releases/<short-sha>-<utc-time>`, не изменяя текущий release. Образы app и migrator получают уникальный release tag. Сборка и pull выполняются до остановки работающего приложения. Затем Compose:

1. запускает/проверяет PostgreSQL healthcheck;
2. однократно выполняет `prisma migrate deploy` в завершившемся контейнере `migrate`;
3. запускает app только после успешной миграции;
4. проверяет `/api/health` внутри контейнера, включая commit, и затем через публичный HTTPS hostname;
5. атомарно переключает symlink `<DEPLOY_PATH>/current` только после успешной проверки.

При ошибке запуска или health verification скрипт поднимает предыдущий app image и повторяет health check. Рабочий checkout, releases, volumes и каталоги не удаляются. Автоматического rollback БД нет. Старые releases и images накапливаются; их cleanup выполняется вручную после проверки, без `docker compose down -v` и без общего `docker system prune --volumes`.

### Проверка и логи

```bash
export DEPLOY_PATH=/srv/selickiy-landing
compose=(docker compose --project-name selickiy-landing --env-file "$DEPLOY_PATH/shared/.env" -f "$DEPLOY_PATH/current/compose.yaml")
"${compose[@]}" ps
"${compose[@]}" logs --tail=150 app migrate db
curl -fsS https://staging.selickiy.space/api/health
```

Ожидаемый health: HTTP 200, `status=ok`, `database=ok` и `commit` развёрнутого SHA. Порты `3000` и `5432` не должны быть опубликованы на хосте.

### Ручной rollback кода

Запустить **Deploy BIGVPS** вручную с полным 40-символьным SHA предыдущего коммита из `main`. Workflow создаст новый release из этого коммита, соберёт его и включит только после health check. Не откатывайте schema destructive-миграцией поверх новых данных.

## Старый VPS (legacy)

Разделы ниже описывают существующий nginx/systemd/webhook deployment на старом VPS и не применяются к BIGVPS.

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

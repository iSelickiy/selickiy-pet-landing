# Project Overview

## Назначение

`selickiy.space` — личная страница Игоря Селицкого: контакты, раскрываемая хронология опыта, pet‑проекты любой степени готовности и лаборатория из custom HTML‑артефактов. Это не коммерческий лендинг; карьерный слой присутствует, но не доминирует.

## Стек

- Node.js 22 (`.nvmrc`, `engines`, CI, Docker)
- Next.js 16.4 с App Router и Cache Components
- React 19.2, TypeScript 5.9, Tailwind CSS 4.3
- Prisma ORM 7.10 + PostgreSQL 16
- NextAuth 4 + Google OAuth
- Tiptap 3.33, Zod, sanitize-html, file-type
- Целевой BIGVPS: Docker Compose и существующий Traefik
- Старый VPS: nginx, systemd, GitHub webhook

Локальная и production Prisma‑схема едины и используют PostgreSQL. Prisma Client генерируется в `src/generated/prisma`.

## Архитектура данных

- Публичные данные читаются через кешируемые функции из `src/lib/publicData.ts`.
- Мутации админки инвалидируют связанные cache tags.
- Rich HTML очищается на сервере; ссылки ограничены протоколами HTTP(S), mailto и tel.
- Изображения хранятся в `UPLOADS_DIR`, по умолчанию `runtime/uploads`, и доступны по `/uploads/<filename>`.
- Custom HTML хранится в `CUSTOM_PAGES_DIR`, по умолчанию `runtime/custom-pages`.
- Runtime‑файлы не входят в git checkout.

## Production

Текущий production на старом VPS использует checkout `/var/www/portfolio`, runtime state `/var/lib/portfolio`, app `127.0.0.1:3000`, webhook `127.0.0.1:9000` и nginx на 80/443. Его конфиги сохранены как legacy и не применяются к новому серверу.

Целевой BIGVPS использует Docker Compose в `<DEPLOY_PATH>/releases`, symlink `<DEPLOY_PATH>/current` и env `<DEPLOY_PATH>/shared/.env`. Next.js не публикует host port и доступен через Traefik по отдельному hostname. PostgreSQL, uploads и custom pages находятся в named volumes; публичного порта PostgreSQL нет.

Health: `GET /api/health`. Ответ 200 возможен только при успешном `SELECT 1` в PostgreSQL; также возвращаются `commit` и `builtAt`.

## Deploy

Сохранённый CI выполняет generate, lint, typecheck, tests, build и audit. После успешного CI для `main` отдельный workflow собирает immutable release прямо на BIGVPS, запускает one-shot `prisma migrate deploy`, проверяет внутренний и HTTPS health и переключает `current`. При ошибке выполняется rollback предыдущего app image; volumes и миграции БД не откатываются.

На старом VPS `infra/deploy.sh` продолжает описывать legacy webhook deploy. Полный BIGVPS runbook и необходимые GitHub Secrets находятся в [Deploy runbook](deploy-runbook.md).

## Backup

Существующий `portfolio-backup.timer` относится только к старому VPS. В BIGVPS deployment постоянные внешние backups, S3 и Restic не добавляются по решению владельца.

## Связанные документы

- [Deploy runbook](deploy-runbook.md)
- [Production maintenance](production-maintenance.md)
- [Custom pages specification](superpowers/specs/2026-04-04-custom-pages.md)

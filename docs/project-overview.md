# Project Overview

## Назначение

`selickiy.space` — личная страница Игоря Селицкого: контакты, раскрываемая хронология опыта, pet‑проекты любой степени готовности и лаборатория из custom HTML‑артефактов. Это не коммерческий лендинг; карьерный слой присутствует, но не доминирует.

## Стек

- Node.js 22 (`.nvmrc`, `engines`, CI)
- Next.js 16.2 с App Router и Cache Components
- React 19.2, TypeScript 5.9, Tailwind CSS 4.3
- Prisma ORM 7.8 + PostgreSQL 16
- NextAuth 4 + Google OAuth
- Tiptap 3.27, Zod, sanitize-html, file-type
- nginx, systemd, GitHub webhook

Локальная и production Prisma‑схема едины и используют PostgreSQL. Prisma Client генерируется в `src/generated/prisma`.

## Архитектура данных

- Публичные данные читаются через кешируемые функции из `src/lib/publicData.ts`.
- Мутации админки инвалидируют связанные cache tags.
- Rich HTML очищается на сервере; ссылки ограничены протоколами HTTP(S), mailto и tel.
- Изображения хранятся в `UPLOADS_DIR`, по умолчанию `runtime/uploads`, и доступны по `/uploads/<filename>`.
- Custom HTML хранится в `CUSTOM_PAGES_DIR`, по умолчанию `runtime/custom-pages`.
- Runtime‑файлы не входят в git checkout.

## Production

- checkout: `/var/www/portfolio`
- runtime state: `/var/lib/portfolio`
- app: `127.0.0.1:3000`
- webhook: `127.0.0.1:9000`
- наружу открыт только nginx на 80/443
- публичный webhook URL: `https://selickiy.space/deploy`
- health: `GET /api/health`

Webhook принимает только подписанные GitHub push‑события для `main`. Секрет хранится в `/etc/portfolio/webhook.env`, не в git. Приложение и webhook работают от пользователя `portfolio`.

## Deploy

`infra/deploy.sh` выполняет pre-deploy backup, `git reset` на `origin/main`, `npm ci`, Prisma generate, lint, typecheck, тесты, build, обратно совместимые миграции, restart и health smoke. Предыдущая `.next` сохраняется для rollback.

Старой подмены production Prisma‑файлов больше нет.

## Backup

`portfolio-backup.timer` ежедневно сохраняет PostgreSQL, uploads и custom pages в `/var/lib/portfolio/backups`, проверяет архивы и держит 14 дней. Offsite‑копия остаётся отдельным операционным этапом.

## Связанные документы

- [Deploy runbook](deploy-runbook.md)
- [Production maintenance](production-maintenance.md)
- [Custom pages specification](superpowers/specs/2026-04-04-custom-pages.md)

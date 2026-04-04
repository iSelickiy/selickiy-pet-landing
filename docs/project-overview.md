# Project Overview

## Назначение

Проект представляет собой персональный сайт-портфолио с публичной витриной и защищённой админкой для управления содержимым.

## Стек

- Next.js 16 App Router
- React 19
- Prisma
- Tailwind CSS 4
- NextAuth
- PostgreSQL 16 на сервере
- nginx + systemd

## Две среды

### `product-mvp`

- локальная среда разработки
- SQLite
- credentials auth
- рабочая папка для разработки

### `portfolio-git`

- git/deploy-клон
- PostgreSQL-ориентированная Prisma-конфигурация
- пушится в GitHub
- используется production deploy pipeline

## Production Deploy Pipeline

Инфраструктура:

- сервер: Ubuntu 24.04
- Node.js 22
- PostgreSQL 16
- nginx
- systemd
- домен `selickiy.space`

Цепочка деплоя:

1. Изменения попадают в `portfolio-git`
2. Выполняется `git push` в `main`
3. GitHub webhook отправляет запрос на сервер
4. webhook service запускает `/var/www/deploy.sh`
5. Скрипт сохраняет server-specific PostgreSQL-файлы: `prisma/schema.prisma`, `src/lib/prisma.ts`, `prisma/seed.ts`
6. Скрипт очищает только эти файлы в рабочем дереве и удаляет известный мусор `._*`
7. Скрипт выполняет `git fetch` и `git reset --hard origin/main`
8. Скрипт восстанавливает server-specific PostgreSQL-файлы из backup
9. Выполняются `npm install`, `npx prisma generate`, `npx prisma migrate deploy`, `npm run build`
10. Рестартуется `portfolio.service`
11. nginx проксирует `selickiy.space` на `localhost:3000`

## Uploads And Runtime Storage

### Медиа

- изображения живут в `public/uploads`

### Custom Pages

- custom HTML pages загружаются после релиза через админку
- они не деплоятся через git push
- хранятся в `CUSTOM_PAGES_DIR`
- рекомендуемый продовый путь: `/var/www/storage/custom-pages`
- должны переживать `git pull`, `npm run build` и рестарт сервиса

## Operational Caveats

- production по-прежнему использует server-specific версии `prisma/schema.prisma`, `src/lib/prisma.ts` и `prisma/seed.ts`, потому что сервер живёт на PostgreSQL, а локальная dev-среда не идентична продовой
- deploy script очищает только эти файлы перед `git reset`, чтобы webhook deploy не падал на локальных server-side изменениях
- Prisma client генерируется в `src/generated/prisma`
- для production важны `prisma generate`, миграции и корректные env-переменные
- runtime storage не должен лежать внутри git-managed файлов проекта
- файлы `._*` — это мусорные macOS metadata files; они не должны попадать ни в git, ни в `/var/www/portfolio`

## Related Docs

- Custom pages spec: [superpowers/specs/2026-04-04-custom-pages.md](superpowers/specs/2026-04-04-custom-pages.md)
- Existing admin redesign spec: [superpowers/specs/2026-04-04-admin-redesign.md](superpowers/specs/2026-04-04-admin-redesign.md)

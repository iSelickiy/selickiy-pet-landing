# selickiy.space — Персональный лендинг

Сайт-портфолио с админ-панелью: [selickiy.space](https://selickiy.space)

## Стек

- **Frontend:** Next.js 16 (App Router), React 19, Tailwind CSS 4, TypeScript
- **CMS:** next-themes, tiptap (WYSIWYG), dnd-kit (drag-n-drop), DOMPurify
- **Backend:** Next.js API routes, Prisma 7, NextAuth.js (Google OAuth)
- **База:** PostgreSQL 16 (production), SQLite (local dev)
- **Деплой:** Ubuntu 24.04 VPS, nginx, systemd, GitHub webhook

## Быстрый старт (local dev)

```bash
npm install
npx prisma generate
npx prisma migrate dev
npm run seed    # опционально — наполнить тестовыми данными
npm run dev     # http://localhost:3000
```

Локально используется SQLite (`prisma/schema.prisma` в корне репо). Для продакшена — PostgreSQL (см. `infra/prisma/production/`).

## Структура проекта

```
.
├── src/
│   ├── app/
│   │   ├── page.tsx                  # Публичная главная (Sidebar + Projects + Resume)
│   │   ├── layout.tsx                # Root layout (шрифты, тема, мета)
│   │   ├── projects/[slug]/page.tsx  # Детальная страница проекта
│   │   ├── custom/[slug]/page.tsx    # Custom HTML-страницы (iframe)
│   │   ├── admin/                    # Админ-панель (Google OAuth)
│   │   │   ├── login/page.tsx
│   │   │   └── (dashboard)/
│   │   │       ├── profile/          # Редактор профиля
│   │   │       ├── resume/           # Редактор резюме
│   │   │       ├── projects/         # CRUD проектов (DnD sort)
│   │   │       ├── media/            # Загрузка изображений
│   │   │       └── custom-pages/     # HTML-страницы
│   │   └── api/                      # REST API (16 рутов)
│   ├── components/
│   │   ├── public/                   # Sidebar, ProjectsGrid, Resume, Footer…
│   │   └── admin/                    # ProfileEditor, ProjectForm, MediaLibrary…
│   ├── lib/
│   │   ├── prisma.ts                 # Prisma client
│   │   ├── auth.ts                   # NextAuth config (Google OAuth)
│   │   ├── customPages.ts            # Генерация slug для custom pages
│   │   └── customPageStorage.ts      # Файловый I/O для custom pages
│   └── generated/prisma/             # Сгенерированный Prisma client
├── prisma/
│   ├── schema.prisma                 # Схема БД (SQLite для локальной разработки)
│   ├── seed.ts                       # Наполнение базы (SQLite)
│   └── migrations/                   # Миграции
├── infra/                            # Инфраструктурные конфиги (production)
│   ├── deploy.sh                     # Deploy-скрипт на сервере
│   ├── webhook.js                    # GitHub webhook listener
│   ├── nginx/selickiy.space.conf     # nginx site config
│   ├── systemd/                      # systemd unit-файлы
│   │   ├── portfolio.service
│   │   └── webhook.service
│   └── prisma/production/            # Production-версии Prisma-файлов
│       ├── schema.prisma             # PostgreSQL datasource
│       ├── prisma.ts                 # pg Pool adapter
│       └── seed.ts                   # Production seed
├── docs/                             # Проектная документация
├── public/uploads/                   # Загруженные медиа (в .gitignore, только local)
├── runtime/                          # Runtime custom pages (в .gitignore, только local)
└── package.json
```

## Деплой

### Инфраструктура сервера

| Компонент | Путь |
|---|---|
| Приложение | `/var/www/portfolio` |
| Deploy-скрипт | `/var/www/deploy.sh` |
| Webhook listener | `/var/www/webhook.js` |
| Custom pages | `/var/www/storage/custom-pages` |
| nginx config | `/etc/nginx/sites-enabled/portfolio` |
| systemd: portfolio | `portfolio.service` — Next.js на `:3000` |
| systemd: webhook | `webhook.service` — слушает `:9000` |
| SSL | Let's Encrypt (certbot auto-renew) |

### Как работает деплой

```
git push origin main
  → GitHub webhook → сервер :9000 (webhook.js)
  → /var/www/deploy.sh:
    1. flock — защита от параллельных деплоев
    2. Бэкап production Prisma-файлов (schema, prisma.ts, seed)
    3. git reset --hard origin/main
    4. Восстановление production Prisma-файлов
    5. npm install → prisma generate → prisma migrate deploy
    6. Бэкап текущего .next
    7. npm run build (с NODE_OPTIONS="--max-old-space-size=512")
    8. systemctl restart portfolio.service
```

**Важно:** 3 Prisma-файла различаются между репозиторием (SQLite) и продакшеном (PostgreSQL):
- `prisma/schema.prisma` — `provider = "sqlite"` в репо → `provider = "postgresql"` на сервере
- `src/lib/prisma.ts` — адаптер sqlite → адаптер pg
- `prisma/seed.ts` — адаптер sqlite → адаптер pg

Production-версии лежат в `infra/prisma/production/`. Deploy-скрипт автоматически подменяет их при каждом деплое.

### GitHub webhook настройка

1. GitHub repo → Settings → Webhooks → Add webhook
2. Payload URL: `http://<server-ip>:9000/deploy`
3. Content type: `application/json`
4. Secret: `portfolio-webhook-secret-2026`
5. Events: Just the `push` event

## API-роуты

| Роут | Методы | Админ? | Назначение |
|---|---|---|---|
| `/api/auth/[...nextauth]` | GET,POST | No | NextAuth handler |
| `/api/settings` | GET,PUT | PUT | Site settings (firstName, avatar…) |
| `/api/content` | GET,PUT | PUT | Content sections (hero, about…) |
| `/api/projects` | GET,POST | GET(?all=true) | Список проектов |
| `/api/projects/[id]` | GET,PUT,DELETE | PUT,DELETE | Один проект |
| `/api/projects/reorder` | PUT | Yes | Drag-n-drop сортировка |
| `/api/resume` | GET,POST | POST | Список опыта |
| `/api/resume/[id]` | PUT,DELETE | Yes | Одна запись |
| `/api/resume/reorder` | PUT | Yes | Сортировка |
| `/api/contact-buttons` | GET,POST | POST | Кнопки контактов |
| `/api/contact-buttons/[id]` | PUT,DELETE | Yes | Одна кнопка |
| `/api/social-links` | GET,PUT | PUT | Соц-сети (bulk обновление) |
| `/api/upload` | GET,POST | Yes | Загрузка медиа |
| `/api/upload/[filename]` | DELETE | Yes | Удаление медиа |
| `/api/custom-pages` | GET,POST | Yes | HTML-страницы |
| `/api/custom-pages/[id]` | GET,PUT,DELETE | Yes | Одна страница |

## Переменные окружения

Создай `.env` в корне (не коммитится):

```env
DATABASE_URL="file:./dev.db"                           # SQLite для локалки
# DATABASE_URL="postgresql://user:pass@localhost:5432/portfolio"  # PostgreSQL для прода

NEXTAUTH_URL="http://localhost:3000"                    # https://selickiy.space на продакшене
NEXTAUTH_SECRET="..."                                   # openssl rand -base64 32
GOOGLE_CLIENT_ID="..."                                  # Google Cloud Console → OAuth
GOOGLE_CLIENT_SECRET="..."
ADMIN_EMAILS="your@gmail.com"                           # Через запятую, кому можно в админку
CUSTOM_PAGES_DIR="./runtime/custom-pages"               # /var/www/storage/custom-pages на продакшене
```

## Google OAuth настройка

1. [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials
2. Создать OAuth 2.0 Client ID (Web application)
3. Authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (local dev)
   - `https://selickiy.space/api/auth/callback/google` (production)
4. Скопировать Client ID и Client Secret в `.env`
5. В `ADMIN_EMAILS` перечислить email'ы, которым разрешён вход в админку

## Бэкап и восстановление

### Резервное копирование

На сервере (cron ежедневно):
```bash
# Дамп базы
pg_dump -U portfolio portfolio > /var/backups/portfolio-$(date +%Y%m%d).sql

# Медиа и custom pages
tar -czf /var/backups/portfolio-runtime-$(date +%Y%m%d).tar.gz \
  /var/www/portfolio/public/uploads \
  /var/www/storage/custom-pages
```

### Disaster Recovery

При полной потере сервера:
1. Новый VPS с Ubuntu 24.04
2. Установить: Node.js 22, PostgreSQL 16, nginx, certbot
3. Склонировать репо: `git clone https://github.com/iSelickiy/selickiy-pet-landing.git /var/www/portfolio`
4. Скопировать `infra/prisma/production/*` на место
5. Скопировать `infra/nginx/selickiy.space.conf` → `/etc/nginx/sites-enabled/portfolio`
6. Скопировать `infra/systemd/*.service` → `/etc/systemd/system/`
7. Создать `.env` с production DATABASE_URL и OAuth-ключами
8. Восстановить базу: `psql portfolio < backup.sql`
9. Восстановить uploads и custom pages
10. `certbot --nginx -d selickiy.space`
11. `systemctl enable --now portfolio.service webhook.service`

### Production-файлы Prisma

Коммитить нужно только SQLite-версию. Production PostgreSQL-версии хранятся в `infra/prisma/production/` как документация. На сервере deploy-скрипт управляет ими автоматически.

## Мониторинг и обслуживание

- **Сервис:** `systemctl status portfolio.service`
- **Webhook:** `systemctl status webhook.service`
- **Логи:** `journalctl -u portfolio.service -f`
- **SSL renewal:** certbot auto-renew (systemd timer, проверять раз в месяц)
- **Память:** 1 GB RAM + 1G swap (билды Next.js требовательны)
- **Деплой проверка:** `curl -sI https://selickiy.space | head`

## Родственные документы

| Документ | Содержание |
|---|---|
| [docs/deploy-runbook.md](docs/deploy-runbook.md) | Полный деплой-ранбук с troubleshooting |
| [docs/project-overview.md](docs/project-overview.md) | Обзор проекта |
| [docs/production-maintenance.md](docs/production-maintenance.md) | Production-операции |
| [docs/superpowers/specs/2026-04-04-custom-pages.md](docs/superpowers/specs/2026-04-04-custom-pages.md) | Спецификация custom pages |
| [docs/superpowers/specs/2026-04-04-admin-redesign.md](docs/superpowers/specs/2026-04-04-admin-redesign.md) | Спецификация редизайна админки |
| [AGENTS.md](AGENTS.md) | Заметки для AI-агентов |

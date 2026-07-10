# selickiy.space

Личная страница: резюме, pet‑проекты, контакты и лаборатория из HTML‑артефактов. Публичный сайт и responsive‑админка работают на Next.js 16, React 19, Prisma 7 и PostgreSQL.

## Local development

Требуются Node.js 22 и PostgreSQL:

```bash
nvm use
cp infra/env/portfolio.env.example .env
npm ci
npm run prisma:generate
npm run db:migrate
npm run seed
npm run dev
```

Проверка перед commit:

```bash
npm run verify
npm audit --omit=dev --audit-level=high
```

## Runtime directories

- `UPLOADS_DIR` — изображения, локально `runtime/uploads`
- `CUSTOM_PAGES_DIR` — custom HTML, локально `runtime/custom-pages`

Оба каталога находятся вне git‑управляемых данных. URL изображений остаётся `/uploads/<filename>`.

## API

- `GET /api/health` → `{ status, database, commit, builtAt }`
- `PUT /api/settings` принимает bulk `{ settings: Record<string,string> }` и временно legacy `{ key, value }`
- `PUT /api/contact-buttons` — bulk сохранение
- mutation errors → `{ error: { code, message, fields? } }`

## Documentation

- [Project overview](docs/project-overview.md)
- [Deploy runbook](docs/deploy-runbook.md)
- [Production maintenance](docs/production-maintenance.md)

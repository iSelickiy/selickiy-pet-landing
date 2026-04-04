# Portfolio Landing

Git/deploy-клон для сайта-портфолио и админки.

## Где что находится

- Dev-окружение: `../product-mvp/`
- Git/deploy-клон: `portfolio-git/`

## Быстрый старт

```bash
npm install
npx prisma generate
npm run build
npm run start
```

## Что важно помнить

- Эта папка пушится в GitHub и участвует в production deploy.
- На сервере используется PostgreSQL.
- Upload-данные и custom HTML pages не должны храниться в git.
- Production deploy очищает только server-specific Prisma-файлы перед `git reset`, а затем восстанавливает их и запускает `prisma generate`, `prisma migrate deploy`, `build` и `restart`.

## Документация

- Полное описание проекта: [docs/project-overview.md](docs/project-overview.md)
- Спецификация custom pages: [docs/superpowers/specs/2026-04-04-custom-pages.md](docs/superpowers/specs/2026-04-04-custom-pages.md)
- Agent notes: [AGENTS.md](AGENTS.md), [CLAUDE.md](CLAUDE.md)

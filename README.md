# Portfolio Landing

Единая рабочая папка для сайта-портфолио, админки, GitHub и production deploy.

## Где что находится

- Рабочий проект: `portfolio-git/`
- Учебный playbook без отдельного лендинга: `../product-playbook/README.md`

## Быстрый старт

```bash
npm install
npx prisma generate
npm run build
npm run start
```

## Что важно помнить

- Последнее обновление: 2026-04-14 (добавлена метка даты для проверки деплоя)
- Эта папка пушится в GitHub и участвует в production deploy.
- `../product-mvp/` больше не нужен как отдельная рабочая копия. Если там остались нужные runtime-файлы, перенесите их в эту папку вручную перед удалением.
- На сервере используется PostgreSQL.
- Upload-данные и custom HTML pages не должны храниться в git.
- Production deploy очищает только server-specific Prisma-файлы перед `git reset`, а затем восстанавливает их и запускает `prisma generate`, `prisma migrate deploy`, `build` и `restart`.
- Webhook deploy стримит логи в journald, держит только один deploy одновременно и старается не оставлять битый `.next`, если build падает.
- На production-сервере включён `1G` swap, потому что `next build` уже упирался в память.

## Документация

- Единый deploy runbook: [docs/deploy-runbook.md](docs/deploy-runbook.md)
- Полное описание проекта: [docs/project-overview.md](docs/project-overview.md)
- Спецификация custom pages: [docs/superpowers/specs/2026-04-04-custom-pages.md](docs/superpowers/specs/2026-04-04-custom-pages.md)
- Production runbook: [docs/production-maintenance.md](docs/production-maintenance.md)
- Agent notes: [AGENTS.md](AGENTS.md), [CLAUDE.md](CLAUDE.md)

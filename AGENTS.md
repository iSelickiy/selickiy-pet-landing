# Agent Notes

- Это git/deploy-клон, который пушится в GitHub.
- Source of truth по проекту: [docs/project-overview.md](docs/project-overview.md)
- Спецификация custom pages: [docs/superpowers/specs/2026-04-04-custom-pages.md](docs/superpowers/specs/2026-04-04-custom-pages.md)
- На сервере используются PostgreSQL, nginx, systemd и webhook deploy.
- Prisma client генерируется в `src/generated/prisma`.
- Runtime HTML pages должны жить в `CUSTOM_PAGES_DIR`, а не в git.

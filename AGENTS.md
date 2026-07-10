# Agent Notes

- Это git/deploy-клон, который пушится в GitHub.
- Source of truth по проекту: [docs/project-overview.md](docs/project-overview.md)
- Спецификация custom pages: [docs/superpowers/specs/2026-04-04-custom-pages.md](docs/superpowers/specs/2026-04-04-custom-pages.md)
- На сервере используются PostgreSQL, nginx, systemd и webhook deploy.
- Prisma client генерируется в `src/generated/prisma`.
- Runtime HTML pages должны жить в `CUSTOM_PAGES_DIR`, а не в git.
- Локально и на сервере используется единая PostgreSQL-схема; подмены Prisma-файлов больше нет.
- Runtime uploads живут в `UPLOADS_DIR`, custom HTML — в `CUSTOM_PAGES_DIR`; оба каталога находятся вне git checkout.
- Production app и webhook слушают только `127.0.0.1`; наружу их публикует nginx.
- macOS metadata files `._*` считаются мусором и не должны попадать ни в git, ни на сервер.

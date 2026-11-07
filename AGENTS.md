# Agent Notes

- Это git/deploy-клон, который пушится в GitHub.
- Source of truth по проекту: [docs/project-overview.md](docs/project-overview.md)
- Спецификация custom pages: [docs/superpowers/specs/2026-04-04-custom-pages.md](docs/superpowers/specs/2026-04-04-custom-pages.md)
- На старом VPS используются PostgreSQL, nginx, systemd и webhook deploy; целевой BIGVPS использует Docker Compose и Traefik.
- Prisma client генерируется в `src/generated/prisma`.
- Runtime HTML pages должны жить в `CUSTOM_PAGES_DIR`, а не в git.
- Локально и на сервере используется единая PostgreSQL-схема; подмены Prisma-файлов больше нет.
- Runtime uploads живут в `UPLOADS_DIR`, custom HTML — в `CUSTOM_PAGES_DIR`; оба каталога находятся вне git checkout.
- На старом VPS app и webhook слушают только `127.0.0.1`; на BIGVPS порты контейнеров не публикуются на хост.
- macOS metadata files `._*` считаются мусором и не должны попадать ни в git, ни на сервер.

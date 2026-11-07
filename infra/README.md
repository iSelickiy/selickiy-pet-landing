# Production infrastructure

## BIGVPS / Docker

| Repository file | Назначение |
|---|---|
| `../Dockerfile` | Multi-stage Node 22 build; non-root app и one-shot migrator |
| `../compose.yaml` | PostgreSQL 16, migrations, Next.js, named volumes и Traefik labels |
| `../.github/workflows/deploy.yml` | Deploy после успешного CI и ручной deploy/rollback |
| `docker-deploy.sh` | Сборка immutable release, health verification и rollback app image |
| `env/bigvps.env.example` | Шаблон `<DEPLOY_PATH>/shared/.env`; secrets не входят в git |

Полный порядок staging → production и требования сервера: [deploy runbook](../docs/deploy-runbook.md). BIGVPS Admin не используется. Постоянные внешние backups/S3/Restic не входят в этот deployment.

## Старый VPS / nginx + systemd

| Repository file | Server target |
|---|---|
| `nginx/selickiy.space.conf` | `/etc/nginx/sites-enabled/portfolio` |
| `systemd/portfolio.service` | `/etc/systemd/system/portfolio.service` |
| `systemd/webhook.service` | `/etc/systemd/system/webhook.service` |
| `systemd/portfolio-backup.*` | `/etc/systemd/system/` |
| `sudoers/portfolio` | `/etc/sudoers.d/portfolio` |
| `env/*.example` | templates only; secrets never enter git |

`deploy.sh`, `backup.sh` and `webhook.mjs` run directly from `/var/www/portfolio/infra` на старом VPS.

Required packages: Node.js 22, PostgreSQL client tools, nginx, certbot, git, curl, rsync/coreutils. Эти файлы не применяются к Docker deployment на BIGVPS.

Runtime uploads используют setgid-группу `portfolio-public`, в которую входят `portfolio` и `www-data`. Остальные runtime-каталоги остаются закрытыми для nginx.

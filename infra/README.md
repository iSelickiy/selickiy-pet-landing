# Production infrastructure

| Repository file | Server target |
|---|---|
| `nginx/selickiy.space.conf` | `/etc/nginx/sites-enabled/portfolio` |
| `systemd/portfolio.service` | `/etc/systemd/system/portfolio.service` |
| `systemd/webhook.service` | `/etc/systemd/system/webhook.service` |
| `systemd/portfolio-backup.*` | `/etc/systemd/system/` |
| `sudoers/portfolio` | `/etc/sudoers.d/portfolio` |
| `env/*.example` | templates only; secrets never enter git |

`deploy.sh`, `backup.sh` and `webhook.mjs` run directly from `/var/www/portfolio/infra`.

Required packages: Node.js 22, PostgreSQL client tools, nginx, certbot, git, curl, rsync/coreutils. See [deploy runbook](../docs/deploy-runbook.md).

Runtime uploads используют setgid-группу `portfolio-public`, в которую входят `portfolio` и `www-data`. Остальные runtime-каталоги остаются закрытыми для nginx.

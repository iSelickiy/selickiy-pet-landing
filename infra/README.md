# Инфраструктурные конфиги

Эти файлы хранятся в репозитории как документация и для Disaster Recovery.
На сервере они расположены по другим путям (см. ниже).

## Назначение файлов

| Файл | Путь на сервере | Назначение |
|---|---|---|
| `deploy.sh` | `/var/www/deploy.sh` | Скрипт деплоя, вызывается webhook'ом |
| `webhook.js` | `/var/www/webhook.js` | GitHub webhook listener на порту 9000 |
| `nginx/selickiy.space.conf` | `/etc/nginx/sites-enabled/portfolio` | nginx: HTTPS reverse proxy на :3000 |
| `systemd/portfolio.service` | `/etc/systemd/system/portfolio.service` | Запуск Next.js production server |
| `systemd/webhook.service` | `/etc/systemd/system/webhook.service` | Запуск webhook listener |
| `prisma/production/` | `/var/www/portfolio/prisma/*` и `src/lib/prisma.ts` | Production Prisma (PostgreSQL) |

## Первичная настройка сервера

```bash
# 1. Системные зависимости
apt update && apt install -y nginx postgresql certbot python3-certbot-nginx

# 2. Node.js 22
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs

# 3. Клонировать репо
git clone https://github.com/iSelickiy/selickiy-pet-landing.git /var/www/portfolio

# 4. Production Prisma (заменить SQLite на PostgreSQL)
cp infra/prisma/production/schema.prisma prisma/schema.prisma
cp infra/prisma/production/prisma.ts src/lib/prisma.ts
cp infra/prisma/production/seed.ts prisma/seed.ts

# 5. Создать .env с production переменными

# 6. Установить и собрать
cd /var/www/portfolio
npm install
npx prisma generate
npx prisma migrate deploy
NODE_OPTIONS="--max-old-space-size=512" npm run build

# 7. Скопировать конфиги на места
cp infra/nginx/selickiy.space.conf /etc/nginx/sites-enabled/portfolio
cp infra/systemd/*.service /etc/systemd/system/

# 8. SSL и запуск
certbot --nginx -d selickiy.space
systemctl enable --now portfolio.service webhook.service
```

## Настройка swap

При 1 GB RAM на сервере билд Next.js может падать по OOM:

```bash
fallocate -l 1G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

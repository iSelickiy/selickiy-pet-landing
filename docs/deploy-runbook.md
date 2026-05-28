# Deploy Runbook

## Что это за файл

Это единый источник правды по деплою проекта `portfolio-git`.

Если нужно быстро понять:

- откуда деплоится код
- что происходит после `git push`
- какие файлы на сервере особенные
- как не потерять runtime-данные
- как проверять, что прод жив
- что делать, если деплой или сайт сломались

смотреть нужно сюда.

## Короткая схема

1. Вы разрабатываете локально в `portfolio-git`
2. Делаете `git push` в `main`
3. GitHub webhook вызывает серверный listener
4. Listener запускает `/var/www/deploy.sh`
5. `deploy.sh` обновляет код, генерирует Prisma client, применяет миграции, собирает Next.js и рестартует `portfolio.service`
6. nginx продолжает проксировать `selickiy.space` на `localhost:3000`

## Где что находится

### Локально

- рабочий проект: `portfolio-git`
- учебный playbook: `../product-playbook/README.md`

### На сервере

- приложение: `/var/www/portfolio`
- deploy script: `/var/www/deploy.sh`
- webhook listener: `/var/www/webhook.js`
- runtime storage для custom pages: `/var/www/storage/custom-pages`
- swap: `/swapfile`

## Инфраструктура production

- сервер: Ubuntu 24.04
- Node.js 22
- PostgreSQL 16
- nginx
- systemd
- домен: `selickiy.space`

Основные сервисы:

- `portfolio.service` — production Next.js app
- `webhook.service` — listener для GitHub webhook

## Как правильно деплоить код

### Обычный сценарий

1. Проверить изменения в `portfolio-git`
2. Закоммитить их
3. Запушить в `main`
4. Дождаться webhook deploy
5. Проверить, что сайт отвечает и сервисы живы

### Команды локально

```bash
cd /Users/selickiy/Code/BOOST/portfolio-git
git status
git add .
git commit -m "your message"
git push origin main
```

## Что делает production deploy

Серверный `/var/www/deploy.sh` сейчас делает следующее:

1. Берёт lock через `flock`, чтобы не шло два deploy одновременно
2. Переходит в `/var/www/portfolio`
3. Делает backup server-specific Prisma-файлов:
   - `prisma/schema.prisma`
   - `src/lib/prisma.ts`
   - `prisma/seed.ts`
4. Удаляет мусорные `._*` файлы
5. Выполняет `git fetch` и `git reset --hard origin/main`
6. Возвращает server-specific Prisma-файлы из backup
7. Запускает:

```bash
npm install --production=false
npx prisma generate
npx prisma migrate deploy
NODE_OPTIONS="--max-old-space-size=512" npm run build
systemctl restart portfolio.service
```

8. Если build падает, старая `.next` восстанавливается из временного backup
9. После build скрипт создаёт Prisma alias-пути в `node_modules/@prisma/...`, если их потребовал Turbopack build

## Почему Prisma тут особенная

Production живёт не на той же конфигурации, что локальный dev.

Сейчас важно помнить:

- локальная разработка не полностью идентична production
- production хранит PostgreSQL-специфичные версии:
  - `prisma/schema.prisma`
  - `src/lib/prisma.ts`
  - `prisma/seed.ts`
- deploy script специально сохраняет их до `git reset` и возвращает обратно

То есть production Prisma сейчас не на 100% “чисто из git”. Это важная особенность проекта.

## Runtime-данные, которые нельзя класть в git

### Custom Pages

HTML-файлы, загружаемые через админку:

- не деплоятся через `git push`
- живут в `CUSTOM_PAGES_DIR`
- текущий production path: `/var/www/storage/custom-pages`

Они должны переживать:

- `git pull`
- `npm run build`
- `systemctl restart portfolio.service`

### Обычное правило

Все пользовательские runtime-данные должны жить вне git checkout.

## Что проверять после деплоя

### Минимум

```bash
systemctl is-active portfolio.service
systemctl is-active webhook.service
curl -I http://127.0.0.1:3000
curl -I https://selickiy.space
```

### Прикладная проверка

- `https://selickiy.space/admin/login` открывается
- `https://selickiy.space/admin/custom-pages` редиректит на login, если нет сессии
- `https://selickiy.space/custom/<missing-slug>` даёт `404`

## Что смотреть, если деплой сломался

### Логи

```bash
journalctl -u portfolio.service -n 100 --no-pager
journalctl -u webhook.service -n 100 --no-pager
```

### Типовые проблемы

#### 1. Битый `.next`

Симптомы:

- `Could not find a production build in the '.next' directory`
- отсутствуют manifest/chunk файлы
- сайт отдаёт `500` или сервис не стартует

Что делать:

1. проверить логи
2. при необходимости пересобрать вручную в `/var/www/portfolio`
3. рестартнуть `portfolio.service`

#### 2. OOM во время deploy

Симптомы:

- `webhook.service` killed by OOM killer
- build прерывается
- сайт может остаться на битом build после reboot

Что уже сделано для защиты:

- включён `1G` swap
- build запускается с лимитом памяти
- webhook не буферизует весь вывод deploy в память

#### 3. Prisma runtime / alias ошибки

Симптомы:

- ошибки вида `Cannot find module '@prisma/client-.../runtime/client'`
- страницы, которые идут в БД, падают с `500`

Что уже сделано для защиты:

- после build deploy script автоматически создаёт нужные alias-ссылки в `node_modules/@prisma`

## Ручное восстановление, если сайт уже сломан

Войти на сервер и перейти в:

```bash
cd /var/www/portfolio
```

Проверить:

```bash
systemctl status portfolio.service
journalctl -u portfolio.service -n 100 --no-pager
```

Если нужен ручной rebuild:

```bash
npm install --production=false
npx prisma generate
npx prisma migrate deploy
npm run build
systemctl restart portfolio.service
```

После этого проверить:

```bash
curl -I http://127.0.0.1:3000
curl -I https://selickiy.space
```

## Важные caveats

- Не складывать runtime HTML в git
- Не удалять `.env`, runtime storage и server-specific Prisma-файлы во время cleanup
- Файлы `._*` — это мусорные macOS metadata files, их можно удалять
- Если меняется Prisma-схема, надо помнить про server-specific PostgreSQL-версии файлов

## Связанные документы

- Общее описание проекта: [project-overview.md](project-overview.md)
- Maintenance notes: [production-maintenance.md](production-maintenance.md)
- Custom pages spec: [superpowers/specs/2026-04-04-custom-pages.md](superpowers/specs/2026-04-04-custom-pages.md)

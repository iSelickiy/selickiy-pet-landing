# Custom Pages

## Goal

Добавить в админку управление одиночными HTML-файлами, которые публикуются по URL `/custom/<slug>`.

## Scope

- загрузка только `.html`
- автогенерация slug
- ручное редактирование slug
- статусы `DRAFT` / `PUBLISHED`
- замена файла
- удаление
- публичный просмотр через `/custom/<slug>`

## Storage

- файл хранится в runtime storage через `CUSTOM_PAGES_DIR`
- файл не должен попадать в git
- файл не должен жить в `public/`

## Security Model

- HTML не вставляется напрямую в DOM сайта
- HTML рендерится через `iframe srcDoc`
- `sandbox="allow-scripts"`
- без `allow-same-origin`
- страница скрыта от индексации

## Deploy Fit

- код фичи попадает в production через `portfolio-git` и webhook deploy
- сами HTML-файлы загружаются после релиза через админку
- runtime storage должен переживать `git pull`, `npm run build` и рестарт сервиса

## Admin UX

- раздел `Custom Pages` в sidebar
- список страниц
- форма создания/редактирования
- отображение итогового URL

## Notes

- На первом этапе не поддерживаются zip-бандлы и связанные ассеты.

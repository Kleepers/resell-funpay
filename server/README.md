# Backend Server - FunPay Parser

NestJS бэкенд с модулем парсинга FunPay. SQLite + Drizzle ORM.

## Установка

```bash
# Установка зависимостей
npm install

# Запуск в development режиме (БД создастся автоматически)
npm run start:dev
```

## Скрипты

```bash
# Development режим с hot-reload
npm run start:dev

# Production сборка
npm run build
npm run start:prod

# Drizzle Kit команды
npm run db:generate   # Генерация миграций
npm run db:push       # Push схемы в БД
npm run db:studio     # Визуальный редактор БД
```

## Структура API

### GET /api/funpay/lots
Список всех спарсенных лотов с пагинацией.

**Query параметры:**
- `page` (default: 1) - номер страницы
- `limit` (default: 20) - количество записей на странице
- `isActive` (optional: true/false) - фильтр по активности

**Пример ответа:**
```json
{
  "data": [
    {
      "id": 1,
      "externalId": "59061487",
      "server": "EU",
      "rank": "Ascendant 1",
      "agentsCount": 17,
      "skinsCount": 45,
      "titleRu": "🟢EU REGION🟢РАСЦВЕТ 1🟢",
      "priceRub": 1500,
      "url": "https://funpay.com/lots/offer?id=59061487",
      "isActive": true,
      "lastSeenAt": "2024-12-10T12:00:00Z"
    }
  ],
  "meta": {
    "total": 150,
    "page": 1,
    "limit": 20,
    "totalPages": 8
  }
}
```

### GET /api/funpay/lots/:id
Детальная информация о лоте по ID.

### POST /api/funpay/parse
Запустить парсинг FunPay вручную.

**Пример ответа:**
```json
{
  "success": true,
  "parsed": 120,
  "new": 15,
  "updated": 100,
  "deactivated": 5
}
```

### GET /api/funpay/stats
Статистика по лотам.

**Пример ответа:**
```json
{
  "total": 150,
  "active": 120,
  "inactive": 30,
  "avgPrice": 2500.50
}
```

## Структура проекта

```
src/
├── database/
│   ├── database.module.ts       # Модуль БД
│   ├── database.service.ts      # Сервис подключения (Drizzle)
│   └── schema.ts                # Схема таблиц
├── modules/
│   └── funpay/
│       ├── funpay.module.ts        # Модуль FunPay
│       ├── funpay.controller.ts    # REST API контроллер
│       ├── funpay.service.ts       # Бизнес-логика (работа с БД)
│       ├── funpay-parser.service.ts # Логика парсинга FunPay
│       └── dto/
│           ├── funpay-lot.dto.ts   # DTO для лотов
│           └── parse-result.dto.ts # DTO результата парсинга
├── app.module.ts                   # Главный модуль
└── main.ts                         # Точка входа

data/
└── dev.db                          # SQLite база данных (создаётся автоматически)
```

## Технологии

- **NestJS** - Node.js фреймворк
- **Drizzle ORM** - TypeScript ORM
- **better-sqlite3** - SQLite драйвер
- **Cheerio** - HTML парсер
- **Axios** - HTTP клиент

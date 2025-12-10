# Backend Implementation Guide - FunPay Parser

## Overview
NestJS backend с модулем парсинга FunPay. SQLite + Prisma ORM.

## Project Setup

```bash
# Инициализация проекта
npx -y @nestjs/cli new backend --package-manager npm --skip-git
cd backend

# Установка зависимостей
npm install @prisma/client axios cheerio
npm install -D prisma @types/cheerio
```

## Prisma Schema

Создать `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}

model FunPayLot {
  id           Int      @id @default(autoincrement())
  externalId   String   @unique // ID лота на FunPay (из URL)
  server       String   // EU, NA, Any
  rank         String   // Расцвет 1, Бессмертный 3
  agentsCount  Int
  skinsCount   Int
  titleRu      String   // Краткое описание RU
  descriptionRu String? // Полное описание RU (опционально)
  priceRub     Float
  url          String   // Полная ссылка на лот
  isActive     Boolean  @default(true)
  firstSeenAt  DateTime @default(now())
  lastSeenAt   DateTime @default(now())
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  g2gLot       G2GLot?
}

model G2GLot {
  id           Int      @id @default(autoincrement())
  funpayLotId  Int      @unique
  funpayLot    FunPayLot @relation(fields: [funpayLotId], references: [id])
  externalId   String?  // ID на G2G (после публикации)
  priceUsd     Float
  status       String   @default("pending") // pending, published, removed, error
  g2gUrl       String?
  errorMessage String?
  publishedAt  DateTime?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}
```

Инициализация:
```bash
npx prisma generate
npx prisma db push
```

---

## API Endpoints

### GET /api/funpay/lots
Список всех спарсенных лотов с пагинацией.

Query params:
- `page` (default: 1)
- `limit` (default: 20)
- `isActive` (optional: true/false)

Response:
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
Детали одного лота.

### POST /api/funpay/parse
Запустить парсинг FunPay вручную.

Response:
```json
{
  "success": true,
  "parsed": 120,
  "new": 15,
  "updated": 100,
  "deactivated": 5
}
```

---

## FunPay Parser Service

### Логика парсинга

1. **Страница списка** (`https://funpay.com/lots/612/`)
   - Получить HTML через axios
   - Найти все `.tc-item[data-f-type="продажа"]`
   - Извлечь href для каждого лота

2. **Страница лота** (`https://funpay.com/lots/offer?id=XXXXX`)
   - Получить HTML
   - Извлечь данные по селекторам

### Селекторы (из docs/selectors.md)

**Страница списка:**
```javascript
const SELECTORS = {
  lotItem: '.tc-item[data-f-type="продажа"]',
  // href берём из самого элемента .tc-item
};
```

**Страница лота:**
```javascript
const LOT_SELECTORS = {
  server: '.param-item:has(h5:contains("Сервер")) > div',
  rank: '.param-item:has(h5:contains("Ранг")) > div',
  agents: '.param-item:has(h5:contains("Количество агентов")) > div',
  skins: '.param-item:has(h5:contains("Количество скинов")) > div',
  title: '.param-item:has(h5:contains("Краткое описание")) > div',
  description: '.param-item:has(h5:contains("Подробное описание")) > div',
  price: '.payment-value',
};
```

### Парсинг цены
```javascript
// "от 10.11Р" -> 10.11
function parsePrice(priceText) {
  const match = priceText.match(/[\d.,]+/);
  return match ? parseFloat(match[0].replace(',', '.')) : 0;
}
```

---

## Структура модуля

```
src/
├── modules/
│   └── funpay/
│       ├── funpay.module.ts
│       ├── funpay.controller.ts
│       ├── funpay.service.ts
│       ├── funpay-parser.service.ts  // Логика парсинга
│       └── dto/
│           ├── funpay-lot.dto.ts
│           └── parse-result.dto.ts
├── prisma/
│   └── prisma.service.ts
└── app.module.ts
```

---

## CORS и запуск

В `main.ts`:
```typescript
app.enableCors({
  origin: 'http://localhost:5173', // Vite dev server
});
await app.listen(3000);
```

## Команды

```bash
npm run start:dev   # Development
npm run build       # Production build
```

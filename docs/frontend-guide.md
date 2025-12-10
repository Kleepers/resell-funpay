# Frontend Implementation Guide - FunPay Lots UI

## Overview
React + Vite + shadcn/ui. Отображение спарсенных лотов и управление парсингом.

## Project Setup

```bash
# Создание проекта
npx -y create-vite frontend --template react-ts
cd frontend

# Установка зависимостей
npm install @tanstack/react-query axios
npm install -D tailwindcss postcss autoprefixer

# Настройка Tailwind
npx tailwindcss init -p

# shadcn/ui
npx shadcn@latest init
# Выбрать: TypeScript, Default style, CSS variables, src/

# Компоненты shadcn
npx shadcn@latest add button table card badge input
```

---

## API Client

`src/lib/api.ts`:
```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
});

export interface FunPayLot {
  id: number;
  externalId: string;
  server: string;
  rank: string;
  agentsCount: number;
  skinsCount: number;
  titleRu: string;
  priceRub: number;
  url: string;
  isActive: boolean;
  lastSeenAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ParseResult {
  success: boolean;
  parsed: number;
  new: number;
  updated: number;
  deactivated: number;
}

export const funpayApi = {
  getLots: (page = 1, limit = 20) =>
    api.get<PaginatedResponse<FunPayLot>>('/funpay/lots', {
      params: { page, limit },
    }),

  getLot: (id: number) =>
    api.get<FunPayLot>(`/funpay/lots/${id}`),

  parse: () =>
    api.post<ParseResult>('/funpay/parse'),
};
```

---

## Pages

### Dashboard (главная)
`src/pages/Dashboard.tsx`

Компоненты:
- Статистика: всего лотов, активных, последнее обновление
- Кнопка "Запустить парсинг"
- Результат последнего парсинга

### Лоты FunPay
`src/pages/FunPayLots.tsx`

Компоненты:
- Таблица с лотами (shadcn Table)
- Колонки: ID, Сервер, Ранг, Агенты, Скины, Цена, Статус, Действия
- Пагинация
- Ссылка на FunPay (открывает в новой вкладке)
- Badge для статуса (active/inactive)

---

## UI Components

### Таблица лотов
Колонки:
| Колонка | Данные | Формат |
|---------|--------|--------|
| ID | externalId | Ссылка на FunPay |
| Сервер | server | Badge (EU/NA/Any) |
| Ранг | rank | Текст |
| Агенты | agentsCount | Число |
| Скины | skinsCount | Число |
| Цена | priceRub | `{price} ₽` |
| Статус | isActive | Badge (Активен/Неактивен) |

### Кнопка парсинга
```tsx
const [isParsing, setIsParsing] = useState(false);

const handleParse = async () => {
  setIsParsing(true);
  try {
    const result = await funpayApi.parse();
    toast.success(`Спарсено: ${result.data.parsed}, новых: ${result.data.new}`);
  } catch (error) {
    toast.error('Ошибка парсинга');
  } finally {
    setIsParsing(false);
  }
};
```

---

## Routing

`src/App.tsx`:
```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/lots" element={<FunPayLots />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
```

Также установить: `npm install react-router-dom`

---

## Дизайн

- Темная тема (shadcn dark mode)
- Sidebar с навигацией: Dashboard, Лоты FunPay
- Responsive таблица
- Loading states

---

## Команды

```bash
npm run dev     # Dev server на :5173
npm run build   # Production
```

## Порты
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3000`

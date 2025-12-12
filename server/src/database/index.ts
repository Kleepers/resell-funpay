import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';
import { resolve } from 'path';

// Путь к файлу базы данных
const dbPath = resolve(__dirname, '../../data/dev.db');

// Создаём подключение к SQLite
const sqlite = new Database(dbPath);

// Включаем WAL mode для лучшей производительности
sqlite.pragma('journal_mode = WAL');

// Экспортируем Drizzle instance
export const db = drizzle(sqlite, { schema });

// Экспортируем схему
export * from './schema';

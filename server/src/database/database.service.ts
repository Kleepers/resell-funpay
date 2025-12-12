import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { drizzle, BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { existsSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import * as schema from './schema';

@Injectable()
export class DatabaseService implements OnModuleInit {
  private readonly logger = new Logger(DatabaseService.name);
  private sqlite: Database.Database;
  public db: BetterSQLite3Database<typeof schema>;

  onModuleInit() {
    // Путь к файлу базы данных
    const dbPath = resolve(process.cwd(), 'data/dev.db');

    // Создаём директорию если её нет
    const dbDir = dirname(dbPath);
    if (!existsSync(dbDir)) {
      mkdirSync(dbDir, { recursive: true });
      this.logger.log(`Created database directory: ${dbDir}`);
    }

    // Создаём подключение к SQLite
    this.sqlite = new Database(dbPath);

    // Включаем WAL mode для лучшей производительности
    this.sqlite.pragma('journal_mode = WAL');

    // Создаём Drizzle instance
    this.db = drizzle(this.sqlite, { schema });

    this.logger.log(`Database connected: ${dbPath}`);

    // Создаём таблицы если их нет
    this.initTables();
  }

  private initTables() {
    // Создаём таблицы вручную (для простоты без миграций)
    this.sqlite.exec(`
      CREATE TABLE IF NOT EXISTS funpay_lots (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        external_id TEXT NOT NULL UNIQUE,
        server TEXT NOT NULL,
        rank TEXT NOT NULL,
        agents_count INTEGER NOT NULL,
        skins_count INTEGER NOT NULL,
        title_ru TEXT NOT NULL,
        description_ru TEXT,
        price_rub REAL NOT NULL,
        url TEXT NOT NULL,
        is_active INTEGER NOT NULL DEFAULT 1,
        first_seen_at INTEGER NOT NULL,
        last_seen_at INTEGER NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS g2g_lots (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        funpay_lot_id INTEGER NOT NULL UNIQUE REFERENCES funpay_lots(id),
        external_id TEXT,
        price_usd REAL NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        g2g_url TEXT,
        error_message TEXT,
        published_at INTEGER,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_funpay_lots_external_id ON funpay_lots(external_id);
      CREATE INDEX IF NOT EXISTS idx_funpay_lots_is_active ON funpay_lots(is_active);
      CREATE INDEX IF NOT EXISTS idx_g2g_lots_status ON g2g_lots(status);
    `);

    this.logger.log('Database tables initialized');
  }

  onModuleDestroy() {
    this.sqlite?.close();
    this.logger.log('Database connection closed');
  }
}

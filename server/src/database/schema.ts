import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

// FunPay лоты
export const funpayLots = sqliteTable('funpay_lots', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  externalId: text('external_id').notNull().unique(), // ID лота на FunPay (из URL)
  server: text('server').notNull(), // EU, NA, Any
  rank: text('rank').notNull(), // Расцвет 1, Бессмертный 3
  agentsCount: integer('agents_count').notNull(),
  skinsCount: integer('skins_count').notNull(),
  titleRu: text('title_ru').notNull(), // Краткое описание RU
  descriptionRu: text('description_ru'), // Полное описание RU (опционально)
  priceRub: real('price_rub').notNull(),
  url: text('url').notNull(), // Полная ссылка на лот
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  firstSeenAt: integer('first_seen_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  lastSeenAt: integer('last_seen_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// G2G лоты (связь с FunPay)
export const g2gLots = sqliteTable('g2g_lots', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  funpayLotId: integer('funpay_lot_id').notNull().unique().references(() => funpayLots.id),
  externalId: text('external_id'), // ID на G2G (после публикации)
  priceUsd: real('price_usd').notNull(),
  status: text('status').notNull().default('pending'), // pending, published, removed, error
  g2gUrl: text('g2g_url'),
  errorMessage: text('error_message'),
  publishedAt: integer('published_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// Relations
export const funpayLotsRelations = relations(funpayLots, ({ one }) => ({
  g2gLot: one(g2gLots, {
    fields: [funpayLots.id],
    references: [g2gLots.funpayLotId],
  }),
}));

export const g2gLotsRelations = relations(g2gLots, ({ one }) => ({
  funpayLot: one(funpayLots, {
    fields: [g2gLots.funpayLotId],
    references: [funpayLots.id],
  }),
}));

// Types
export type FunPayLot = typeof funpayLots.$inferSelect;
export type NewFunPayLot = typeof funpayLots.$inferInsert;
export type G2GLot = typeof g2gLots.$inferSelect;
export type NewG2GLot = typeof g2gLots.$inferInsert;

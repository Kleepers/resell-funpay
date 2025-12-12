import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { eq, and, count, avg, sql } from 'drizzle-orm';
import { DatabaseService } from '../../database/database.service';
import { funpayLots, FunPayLot } from '../../database/schema';
import { FunpayParserService, ParsedLotDetails } from './funpay-parser.service';
import {
  FunPayLotQueryDto,
  PaginatedFunPayLotsDto,
  FunPayLotDto,
  ParseResultDto,
} from './dto';

@Injectable()
export class FunpayService {
  private readonly logger = new Logger(FunpayService.name);

  constructor(
    private readonly database: DatabaseService,
    private readonly parser: FunpayParserService,
  ) { }

  /**
   * Преобразование записи БД в DTO
   */
  private toDto(lot: FunPayLot): FunPayLotDto {
    return {
      id: lot.id,
      externalId: lot.externalId,
      server: lot.server,
      rank: lot.rank,
      agentsCount: lot.agentsCount,
      skinsCount: lot.skinsCount,
      titleRu: lot.titleRu,
      descriptionRu: lot.descriptionRu,
      priceRub: lot.priceRub,
      url: lot.url,
      isActive: lot.isActive,
      firstSeenAt: lot.firstSeenAt,
      lastSeenAt: lot.lastSeenAt,
      createdAt: lot.createdAt,
      updatedAt: lot.updatedAt,
    };
  }

  /**
   * Получение списка лотов с пагинацией
   */
  async getLots(query: FunPayLotQueryDto): Promise<PaginatedFunPayLotsDto> {
    const { page = 1, limit = 20, isActive } = query;
    const offset = (page - 1) * limit;

    // Формируем условие where
    const whereCondition = isActive !== undefined
      ? eq(funpayLots.isActive, isActive)
      : undefined;

    // Получаем данные
    const data = await this.database.db
      .select()
      .from(funpayLots)
      .where(whereCondition)
      .orderBy(sql`${funpayLots.lastSeenAt} DESC`)
      .limit(limit)
      .offset(offset);

    // Получаем общее количество
    const totalResult = await this.database.db
      .select({ count: count() })
      .from(funpayLots)
      .where(whereCondition);

    const total = totalResult[0]?.count || 0;

    return {
      data: data.map(lot => this.toDto(lot)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Получение одного лота по ID
   */
  async getLotById(id: number): Promise<FunPayLotDto> {
    const result = await this.database.db
      .select()
      .from(funpayLots)
      .where(eq(funpayLots.id, id))
      .limit(1);

    if (result.length === 0) {
      throw new NotFoundException(`Lot with ID ${id} not found`);
    }

    return this.toDto(result[0]);
  }

  /**
   * Получение лота по внешнему ID (FunPay ID)
   */
  async getLotByExternalId(externalId: string): Promise<FunPayLotDto | null> {
    const result = await this.database.db
      .select()
      .from(funpayLots)
      .where(eq(funpayLots.externalId, externalId))
      .limit(1);

    return result.length > 0 ? this.toDto(result[0]) : null;
  }

  /**
   * Запуск парсинга и синхронизация с базой данных
   */
  async runParsing(): Promise<ParseResultDto> {
    this.logger.log('Starting FunPay parsing...');

    const result: ParseResultDto = {
      success: false,
      parsed: 0,
      new: 0,
      updated: 0,
      deactivated: 0,
      errors: [],
    };

    try {
      // Получаем спарсенные лоты
      const parsedLots = await this.parser.parseAllLots();
      result.parsed = parsedLots.length;

      // Получаем текущие активные external IDs из базы
      const currentActiveRecords = await this.database.db
        .select({ externalId: funpayLots.externalId })
        .from(funpayLots)
        .where(eq(funpayLots.isActive, true));

      const currentActiveIds = new Set(currentActiveRecords.map(r => r.externalId));

      // Set для отслеживания обработанных ID
      const processedIds = new Set<string>();
      const now = new Date();

      // Обрабатываем каждый спарсенный лот
      for (const parsedLot of parsedLots) {
        processedIds.add(parsedLot.externalId);

        try {
          const existing = await this.database.db
            .select()
            .from(funpayLots)
            .where(eq(funpayLots.externalId, parsedLot.externalId))
            .limit(1);

          if (existing.length > 0) {
            // Обновляем существующий лот
            await this.database.db
              .update(funpayLots)
              .set({
                server: parsedLot.server,
                rank: parsedLot.rank,
                agentsCount: parsedLot.agentsCount,
                skinsCount: parsedLot.skinsCount,
                titleRu: parsedLot.titleRu,
                descriptionRu: parsedLot.descriptionRu,
                priceRub: parsedLot.priceRub,
                url: parsedLot.url,
                isActive: true,
                lastSeenAt: now,
                updatedAt: now,
              })
              .where(eq(funpayLots.externalId, parsedLot.externalId));
            result.updated++;
          } else {
            // Создаём новый лот
            await this.database.db
              .insert(funpayLots)
              .values({
                externalId: parsedLot.externalId,
                server: parsedLot.server,
                rank: parsedLot.rank,
                agentsCount: parsedLot.agentsCount,
                skinsCount: parsedLot.skinsCount,
                titleRu: parsedLot.titleRu,
                descriptionRu: parsedLot.descriptionRu,
                priceRub: parsedLot.priceRub,
                url: parsedLot.url,
                isActive: true,
                firstSeenAt: now,
                lastSeenAt: now,
                createdAt: now,
                updatedAt: now,
              });
            result.new++;
          }
        } catch (error) {
          const errorMessage = `Failed to process lot ${parsedLot.externalId}: ${error}`;
          this.logger.error(errorMessage);
          result.errors!.push(errorMessage);
        }
      }

      // Деактивируем лоты, которые больше не присутствуют на FunPay
      for (const existingId of currentActiveIds) {
        if (!processedIds.has(existingId)) {
          try {
            await this.database.db
              .update(funpayLots)
              .set({
                isActive: false,
                updatedAt: now,
              })
              .where(eq(funpayLots.externalId, existingId));
            result.deactivated++;
          } catch (error) {
            const errorMessage = `Failed to deactivate lot ${existingId}: ${error}`;
            this.logger.error(errorMessage);
            result.errors!.push(errorMessage);
          }
        }
      }

      result.success = true;
      this.logger.log(
        `Parsing completed: ${result.new} new, ${result.updated} updated, ${result.deactivated} deactivated`,
      );
    } catch (error) {
      const errorMessage = `Parsing failed: ${error}`;
      this.logger.error(errorMessage);
      result.errors!.push(errorMessage);
    }

    // Убираем пустой массив ошибок
    if (result.errors!.length === 0) {
      delete result.errors;
    }

    return result;
  }

  /**
   * Получение статистики
   */
  async getStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    avgPrice: number;
  }> {
    const [totalResult, activeResult, avgResult] = await Promise.all([
      this.database.db.select({ count: count() }).from(funpayLots),
      this.database.db.select({ count: count() }).from(funpayLots).where(eq(funpayLots.isActive, true)),
      this.database.db.select({ avg: avg(funpayLots.priceRub) }).from(funpayLots).where(eq(funpayLots.isActive, true)),
    ]);

    const total = totalResult[0]?.count || 0;
    const active = activeResult[0]?.count || 0;

    return {
      total,
      active,
      inactive: total - active,
      avgPrice: avgResult[0]?.avg ? Number(avgResult[0].avg) : 0,
    };
  }
}

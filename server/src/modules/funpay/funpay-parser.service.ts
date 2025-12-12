import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import * as cheerio from 'cheerio';

export interface ParsedLotListItem {
  externalId: string;
  url: string;
  priceRub: number;
}

export interface ParsedLotDetails {
  externalId: string;
  server: string;
  rank: string;
  agentsCount: number;
  skinsCount: number;
  titleRu: string;
  descriptionRu: string | null;
  priceRub: number;
  url: string;
}

// Селекторы для страницы списка
const LIST_SELECTORS = {
  lotItem: '.tc-item[data-f-type="продажа"]',
  price: '.tc-price',
};

// Селекторы для страницы лота
const LOT_SELECTORS = {
  server: '.param-item:has(h5:contains("Сервер")) > div',
  rank: '.param-item:has(h5:contains("Ранг")) > div',
  agents: '.param-item:has(h5:contains("Количество агентов")) > div',
  skins: '.param-item:has(h5:contains("Количество скинов")) > div',
  title: '.param-item:has(h5:contains("Краткое описание")) > div',
  description: '.param-item:has(h5:contains("Подробное описание")) > div',
  price: '.payment-value',
};

// URL страницы Valorant Accounts
const FUNPAY_VALORANT_URL = 'https://funpay.com/lots/612/';

@Injectable()
export class FunpayParserService {
  private readonly logger = new Logger(FunpayParserService.name);

  /**
   * Парсинг числа из строки цены
   * "от 10.11Р" -> 10.11
   */
  private parsePrice(priceText: string): number {
    const match = priceText.match(/[\d.,]+/);
    return match ? parseFloat(match[0].replace(',', '.')) : 0;
  }

  /**
   * Парсинг числа из строки
   * "17" -> 17
   */
  private parseNumber(text: string): number {
    const match = text.match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
  }

  /**
   * Извлечение ID лота из URL
   * "https://funpay.com/lots/offer?id=59061487" -> "59061487"
   */
  private extractLotId(url: string): string | null {
    const match = url.match(/[?&]id=(\d+)/);
    return match ? match[1] : null;
  }

  /**
   * Получение HTML страницы
   */
  private async fetchPage(url: string): Promise<string> {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
        },
        timeout: 30000,
      });
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to fetch page: ${url}`, error);
      throw error;
    }
  }

  /**
   * Парсинг страницы списка лотов
   * Возвращает список URL-ов и ID лотов типа "продажа"
   */
  async parseListPage(): Promise<ParsedLotListItem[]> {
    this.logger.log('Parsing FunPay list page...');

    const html = await this.fetchPage(FUNPAY_VALORANT_URL);
    const $ = cheerio.load(html);

    const items: ParsedLotListItem[] = [];

    $(LIST_SELECTORS.lotItem).each((_, element) => {
      const href = $(element).attr('href');
      if (href) {
        const fullUrl = href.startsWith('http')
          ? href
          : `https://funpay.com${href}`;
        const externalId = this.extractLotId(fullUrl);

        const priceText = $(element).find(LIST_SELECTORS.price).text();
        const priceRub = this.parsePrice(priceText);

        if (externalId) {
          items.push({
            externalId,
            url: fullUrl,
            priceRub,
          });
        }
      }
    });

    this.logger.log(`Found ${items.length} sale lots`);
    return items;
  }

  /**
   * Парсинг страницы отдельного лота
   */
  async parseLotPage(url: string, externalId: string, fallbackPrice: number = 0): Promise<ParsedLotDetails | null> {
    try {
      this.logger.debug(`Parsing lot: ${externalId}`);

      const html = await this.fetchPage(url);
      const $ = cheerio.load(html);

      // Функция для извлечения текста по селектору
      const getText = (selector: string): string => {
        return $(selector).first().text().trim();
      };

      const server = getText(LOT_SELECTORS.server) || 'Any';
      const rank = getText(LOT_SELECTORS.rank) || 'Unknown';
      const agentsText = getText(LOT_SELECTORS.agents);
      const skinsText = getText(LOT_SELECTORS.skins);
      const titleRu = getText(LOT_SELECTORS.title);
      const descriptionRu = getText(LOT_SELECTORS.description) || null;
      const priceText = getText(LOT_SELECTORS.price);

      const agentsCount = this.parseNumber(agentsText);
      const skinsCount = this.parseNumber(skinsText);
      let priceRub = this.parsePrice(priceText);

      // If price parsing failed (or is 0) and we have a fallback, use it
      if (priceRub === 0 && fallbackPrice > 0) {
        priceRub = fallbackPrice;
      }

      return {
        externalId,
        server,
        rank,
        agentsCount,
        skinsCount,
        titleRu,
        descriptionRu,
        priceRub,
        url,
      };
    } catch (error) {
      this.logger.error(`Failed to parse lot ${externalId}:`, error);
      return null;
    }
  }

  /**
   * Полный парсинг - список + детали каждого лота
   * С задержкой между запросами чтобы не перегружать сервер
   */
  async parseAllLots(delayMs: number = 500): Promise<ParsedLotDetails[]> {
    const listItems = await this.parseListPage();
    const results: ParsedLotDetails[] = [];

    for (let i = 0; i < listItems.length; i++) {
      const item = listItems[i];

      const details = await this.parseLotPage(item.url, item.externalId, item.priceRub);
      if (details) {
        results.push(details);
      }

      // Добавляем задержку между запросами
      if (i < listItems.length - 1 && delayMs > 0) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }

      // Логируем прогресс каждые 10 лотов
      if ((i + 1) % 10 === 0) {
        this.logger.log(`Parsed ${i + 1}/${listItems.length} lots`);
      }
    }

    this.logger.log(`Successfully parsed ${results.length} lots`);
    return results;
  }
}

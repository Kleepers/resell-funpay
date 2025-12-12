import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FunpayService } from './funpay.service';
import {
  FunPayLotQueryDto,
  PaginatedFunPayLotsDto,
  FunPayLotDto,
  ParseResultDto,
} from './dto';

@Controller('api/funpay')
export class FunpayController {
  constructor(private readonly funpayService: FunpayService) { }

  /**
   * GET /api/funpay/lots
   * Получение списка лотов с пагинацией
   */
  @Get('lots')
  async getLots(@Query() query: FunPayLotQueryDto): Promise<PaginatedFunPayLotsDto> {
    return this.funpayService.getLots(query);
  }

  /**
   * GET /api/funpay/lots/:id
   * Получение детальной информации о лоте
   */
  @Get('lots/:id')
  async getLotById(@Param('id', ParseIntPipe) id: number): Promise<FunPayLotDto> {
    return this.funpayService.getLotById(id);
  }

  /**
   * POST /api/funpay/parse
   * Запуск парсинга FunPay вручную
   */
  @Post('parse')
  @HttpCode(HttpStatus.OK)
  async runParsing(): Promise<ParseResultDto> {
    return this.funpayService.runParsing();
  }

  /**
   * GET /api/funpay/stats
   * Получение статистики по лотам
   */
  @Get('stats')
  async getStats() {
    return this.funpayService.getStats();
  }
}

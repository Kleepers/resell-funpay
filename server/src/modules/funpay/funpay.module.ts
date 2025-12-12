import { Module } from '@nestjs/common';
import { FunpayController } from './funpay.controller';
import { FunpayService } from './funpay.service';
import { FunpayParserService } from './funpay-parser.service';

@Module({
  controllers: [FunpayController],
  providers: [FunpayService, FunpayParserService],
  exports: [FunpayService, FunpayParserService],
})
export class FunpayModule { }

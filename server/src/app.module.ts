import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { FunpayModule } from './modules/funpay/funpay.module';

@Module({
  imports: [DatabaseModule, FunpayModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }

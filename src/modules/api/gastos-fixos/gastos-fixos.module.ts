import { Module } from '@nestjs/common';
import { GastosFixosService } from './gastos-fixos.service';
import { GastosFixosController } from './gastos-fixos.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [GastosFixosService],
  controllers: [GastosFixosController]
})
export class GastosFixosModule {}

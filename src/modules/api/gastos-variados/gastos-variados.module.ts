import { Module } from '@nestjs/common';
import { GastosVariadosService } from './gastos-variados.service';
import { GastosVariadosController } from './gastos-variados.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [GastosVariadosService],
  controllers: [GastosVariadosController]
})
export class GastosVariadosModule {}

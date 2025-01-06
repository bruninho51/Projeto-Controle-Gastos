import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { CategoriasGastosModule } from './api/categorias-gastos/categorias-gastos.module';
import { OrcamentosModule } from './api/orcamentos/orcamentos.module';
import { GastosFixosModule } from './api/gastos-fixos/gastos-fixos.module';

@Module({
  imports: [
    PrismaModule, 
    CategoriasGastosModule, 
    OrcamentosModule,
    GastosFixosModule
  ],
})
export class AppModule {}

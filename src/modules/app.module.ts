import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { CategoriasGastosModule } from './api/categorias-gastos/categorias-gastos.module';
import { OrcamentosModule } from './api/orcamentos/orcamentos.module';

@Module({
  imports: [
    PrismaModule, 
    CategoriasGastosModule, 
    OrcamentosModule
  ],
})
export class AppModule {}

import { Module } from "@nestjs/common";
import { PrismaModule } from "./prisma/prisma.module";
import { CategoriasGastosModule } from "./api/categorias-gastos/categorias-gastos.module";
import { OrcamentosModule } from "./api/orcamentos/orcamentos.module";
import { GastosFixosModule } from "./api/gastos-fixos/gastos-fixos.module";
import { GastosVariadosModule } from "./api/gastos-variados/gastos-variados.module";

@Module({
  imports: [
    PrismaModule,
    CategoriasGastosModule,
    OrcamentosModule,
    GastosFixosModule,
    GastosVariadosModule,
  ],
})
export class AppModule {}

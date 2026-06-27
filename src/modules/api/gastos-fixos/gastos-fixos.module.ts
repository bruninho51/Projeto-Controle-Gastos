import { Module } from "@nestjs/common";
import { GastosFixosService } from "./gastos-fixos.service";
import { GastosFixosController } from "./gastos-fixos.controller";
import { PrismaModule } from "../../prisma/prisma.module";
import { OrcamentosModule } from "../orcamentos/orcamentos.module";
import { CategoriasGastosModule } from "../categorias-gastos/categorias-gastos.module";
import { TokensDispositivosModule } from "../tokens-dispositivos/tokens-dispositivos.module";
import { GastosFixosScheduler } from "./gastos-fixos.scheduler";

@Module({
  imports: [
    PrismaModule,
    OrcamentosModule,
    CategoriasGastosModule,
    TokensDispositivosModule,
  ],
  providers: [GastosFixosService, GastosFixosScheduler],
  controllers: [GastosFixosController],
})
export class GastosFixosModule {}

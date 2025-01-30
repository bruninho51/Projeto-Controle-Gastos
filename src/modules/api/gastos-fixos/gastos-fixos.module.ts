import { Module } from "@nestjs/common";
import { GastosFixosService } from "./gastos-fixos.service";
import { GastosFixosController } from "./gastos-fixos.controller";
import { PrismaModule } from "../../prisma/prisma.module";
import { OrcamentosModule } from "../orcamentos/orcamentos.module";
import { CategoriasGastosModule } from "../categorias-gastos/categorias-gastos.module";

@Module({
  imports: [PrismaModule, OrcamentosModule, CategoriasGastosModule],
  providers: [GastosFixosService],
  controllers: [GastosFixosController],
})
export class GastosFixosModule {}

import { Module } from "@nestjs/common";
import { GastosVariadosService } from "./gastos-variados.service";
import { GastosVariadosController } from "./gastos-variados.controller";
import { PrismaModule } from "../../prisma/prisma.module";
import { OrcamentosModule } from "../orcamentos/orcamentos.module";
import { CategoriasGastosModule } from "../categorias-gastos/categorias-gastos.module";

@Module({
  imports: [PrismaModule, OrcamentosModule, CategoriasGastosModule],
  providers: [GastosVariadosService],
  controllers: [GastosVariadosController],
})
export class GastosVariadosModule {}

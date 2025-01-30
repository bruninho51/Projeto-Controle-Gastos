import { Module } from "@nestjs/common";
import { CategoriasGastosController } from "./categorias-gastos.controller";
import { CategoriasGastosService } from "./categorias-gastos.service";
import { PrismaModule } from "../../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [CategoriasGastosController],
  providers: [CategoriasGastosService],
  exports: [CategoriasGastosService],
})
export class CategoriasGastosModule {}

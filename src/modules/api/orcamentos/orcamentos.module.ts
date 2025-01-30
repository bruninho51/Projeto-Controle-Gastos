import { Module } from "@nestjs/common";
import { OrcamentosService } from "./orcamentos.service";
import { OrcamentosController } from "./orcamentos.controller";
import { PrismaModule } from "../../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  providers: [OrcamentosService],
  controllers: [OrcamentosController],
  exports: [OrcamentosService],
})
export class OrcamentosModule {}

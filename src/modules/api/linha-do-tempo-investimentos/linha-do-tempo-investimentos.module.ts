import { Module } from "@nestjs/common";
import { LinhaDoTempoInvestimentosService } from "./linha-do-tempo-investimentos.service";
import { LinhaDoTempoInvestimentosController } from "./linha-do-tempo-investimentos.controller";
import { PrismaModule } from "../../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  providers: [LinhaDoTempoInvestimentosService],
  controllers: [LinhaDoTempoInvestimentosController],
})
export class LinhaDoTempoInvestimentosModule {}

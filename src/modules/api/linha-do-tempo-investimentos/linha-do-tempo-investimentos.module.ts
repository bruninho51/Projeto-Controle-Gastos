import { Module } from "@nestjs/common";
import { LinhaDoTempoInvestimentosService } from "./linha-do-tempo-investimentos.service";
import { LinhaDoTempoInvestimentosController } from "./linha-do-tempo-investimentos.controller";
import { PrismaModule } from "../../prisma/prisma.module";
import { InvestimentosModule } from "../investimentos/investimentos.module";

@Module({
  imports: [PrismaModule, InvestimentosModule],
  providers: [LinhaDoTempoInvestimentosService],
  controllers: [LinhaDoTempoInvestimentosController],
})
export class LinhaDoTempoInvestimentosModule {}

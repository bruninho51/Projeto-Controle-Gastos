import { Module } from "@nestjs/common";
import { InvestimentosController } from "./investimentos.controller";
import { InvestimentosService } from "./investimentos.service";
import { PrismaModule } from "../../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [InvestimentosController],
  providers: [InvestimentosService],
  exports: [InvestimentosService],
})
export class InvestimentosModule {}

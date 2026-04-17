import { Module } from "@nestjs/common";
import { GastosVencidosService } from "./gastos-vencidos.service";
import { GastosVencidosScheduler } from "./gastos-vencidos.scheduler";
import { PrismaModule } from "../../prisma/prisma.module";
import { TokensDispositivosModule } from "../tokens-dispositivos/tokens-dispositivos.module";

@Module({
  imports: [PrismaModule, TokensDispositivosModule],
  providers: [GastosVencidosService, GastosVencidosScheduler],
})
export class GastosVencidosModule {}

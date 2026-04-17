import { Module } from "@nestjs/common";
import { PrismaModule } from "./prisma/prisma.module";
import { CategoriasGastosModule } from "./api/categorias-gastos/categorias-gastos.module";
import { OrcamentosModule } from "./api/orcamentos/orcamentos.module";
import { GastosFixosModule } from "./api/gastos-fixos/gastos-fixos.module";
import { GastosVariadosModule } from "./api/gastos-variados/gastos-variados.module";
import { InvestimentosModule } from "./api/investimentos/investimentos.module";
import { LinhaDoTempoInvestimentosModule } from "./api/linha-do-tempo-investimentos/linha-do-tempo-investimentos.module";
import { TokensDispositivosModule } from "./api/tokens-dispositivos/tokens-dispositivos.module";
import { AuthModule } from "./api/auth/auth.module";
import { MonitoringModule } from "./monitoring/monitoring.module";
import { ScheduleModule } from "@nestjs/schedule";
import { GastosVencidosModule } from "./api/gastos-vencidos/gastos-vencidos.module";

@Module({
  imports: [
    PrismaModule,
    ScheduleModule.forRoot(),
    CategoriasGastosModule,
    OrcamentosModule,
    GastosFixosModule,
    GastosVariadosModule,
    InvestimentosModule,
    LinhaDoTempoInvestimentosModule,
    TokensDispositivosModule,
    AuthModule,
    MonitoringModule,
    GastosVencidosModule,
  ],
})
export class AppModule {}

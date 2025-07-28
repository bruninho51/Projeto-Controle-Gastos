import { Module } from "@nestjs/common";
import { PrismaModule } from "./prisma/prisma.module";
import { CategoriasGastosModule } from "./api/categorias-gastos/categorias-gastos.module";
import { OrcamentosModule } from "./api/orcamentos/orcamentos.module";
import { GastosFixosModule } from "./api/gastos-fixos/gastos-fixos.module";
import { GastosVariadosModule } from "./api/gastos-variados/gastos-variados.module";
import { InvestimentosModule } from "./api/investimentos/investimentos.module";
import { LinhaDoTempoInvestimentosModule } from "./api/linha-do-tempo-investimentos/linha-do-tempo-investimentos.module";
import { AuthModule } from "./api/auth/auth.module";
import { WebModule } from "./web/web.module";
import { PrometheusModule } from "@willsoto/nestjs-prometheus";
import { MonitoringModule } from "./monitoring/monitoring.module";

@Module({
  imports: [
    PrismaModule,
    CategoriasGastosModule,
    OrcamentosModule,
    GastosFixosModule,
    GastosVariadosModule,
    InvestimentosModule,
    LinhaDoTempoInvestimentosModule,
    AuthModule,
    WebModule,
    MonitoringModule,
  ],
})
export class AppModule {}




import { Module } from "@nestjs/common";
import { PadroesNotificacoesBancariasController } from "./padroes-notificacoes-bancarias.controller";
import { PadroesNotificacoesBancariasService } from "./padroes-notificacoes-bancarias.service";
import { PrismaModule } from "../../prisma/prisma.module";
import { GeminiModule } from "../../gemini/gemini.module";

@Module({
  imports: [PrismaModule, GeminiModule],
  controllers: [PadroesNotificacoesBancariasController],
  providers: [PadroesNotificacoesBancariasService],
  exports: [PadroesNotificacoesBancariasService],
})
export class PadroesNotificacoesBancariasModule {}

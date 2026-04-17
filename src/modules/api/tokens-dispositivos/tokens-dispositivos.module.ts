import { Module } from "@nestjs/common";
import { TokensDispositivosService } from "./tokens-dispositivos.service";
import { TokensDispositivosController } from "./tokens-dispositivos.controller";
import { PrismaModule } from "../../prisma/prisma.module";
import { TokensDispositivosNotificacaoService } from "./tokens-dispositivos-notificacao.service";

@Module({
  imports: [PrismaModule],
  providers: [TokensDispositivosService, TokensDispositivosNotificacaoService],
  controllers: [TokensDispositivosController],
  exports: [TokensDispositivosService, TokensDispositivosNotificacaoService],
})
export class TokensDispositivosModule {}

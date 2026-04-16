import { Module } from "@nestjs/common";
import { TokensDispositivosService } from "./tokens-dispositivos.service";
import { TokensDispositivosController } from "./tokens-dispositivos.controller";
import { PrismaModule } from "../../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  providers: [TokensDispositivosService],
  controllers: [TokensDispositivosController],
  exports: [TokensDispositivosService],
})
export class TokensDispositivosModule {}
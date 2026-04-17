import { Injectable, Logger } from "@nestjs/common";
import * as admin from "firebase-admin";
import { Inject } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { TokenDispositivoNotificacaoDto } from "./dtos/TokenDispositivoNotificacao.dto";

const FIREBASE_TOKEN_EXPIRADO_CODES = [
  "messaging/invalid-registration-token",
  "messaging/registration-token-not-registered",
];

@Injectable()
export class TokensDispositivosNotificacaoService {
  private readonly logger = new Logger(
    TokensDispositivosNotificacaoService.name,
  );

  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async enviar({
    tokens,
    titulo,
    corpo,
    dados,
  }: TokenDispositivoNotificacaoDto): Promise<void> {
    if (!tokens.length) return;

    const response = await admin.messaging().sendEachForMulticast({
      tokens,
      notification: {
        title: titulo,
        body: corpo,
      },
      data: dados,
      android: {
        priority: "high",
        collapseKey: dados?.gasto_id ? `gasto_${dados.gasto_id}` : undefined,
        notification: {
          sound: "default",
          tag: dados?.gasto_id ? `gasto_${dados.gasto_id}` : undefined, // <- substitui a notificação anterior no Android
        },
      },
      apns: {
        headers: {
          "apns-collapse-id": dados?.gasto_id
            ? `gasto_${dados.gasto_id}`
            : undefined, // <- substitui no iOS
        },
        payload: {
          aps: {
            sound: "default",
            badge: 1,
          },
        },
      },
    });

    const sucessos = response.responses.filter((r) => r.success).length;
    this.logger.log(`Notificações enviadas: ${sucessos}/${tokens.length}`);

    const tokensExpirados: string[] = response.responses
      .map((r, index) => ({ r, token: tokens[index] }))
      .filter(
        ({ r }) =>
          !r.success && FIREBASE_TOKEN_EXPIRADO_CODES.includes(r.error?.code),
      )
      .map(({ token }) => token);

    const outrosFalhas = response.responses
      .map((r, index) => ({ r, token: tokens[index] }))
      .filter(
        ({ r }) =>
          !r.success && !FIREBASE_TOKEN_EXPIRADO_CODES.includes(r.error?.code),
      );

    if (outrosFalhas.length) {
      outrosFalhas.forEach(({ r, token }) => {
        this.logger.warn(
          `Falha ao enviar para token ${token}: ${r.error?.message}`,
        );
      });
    }

    if (tokensExpirados.length) {
      this.logger.log(
        `Removendo ${tokensExpirados.length} token(s) expirado(s) da base de dados...`,
      );

      await this.prisma.tokenDispositivo.deleteMany({
        where: {
          token: { in: tokensExpirados },
        },
      });

      this.logger.log(
        `Tokens expirados removidos: ${tokensExpirados.join(", ")}`,
      );
    }
  }
}

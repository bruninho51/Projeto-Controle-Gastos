import { Test, TestingModule } from "@nestjs/testing";
import { TokensDispositivosNotificacaoService } from "./tokens-dispositivos-notificacao.service";
import { PrismaService } from "../../prisma/prisma.service";
import { TokenDispositivoNotificacaoDto } from "./dtos/TokenDispositivoNotificacao.dto";
import { faker } from "@faker-js/faker";
import * as admin from "firebase-admin";

jest.mock("firebase-admin", () => ({
  messaging: jest.fn(),
}));

function buildNotificacaoDto(
  overrides: Partial<TokenDispositivoNotificacaoDto> = {},
): TokenDispositivoNotificacaoDto {
  const dto = new TokenDispositivoNotificacaoDto();
  dto.tokens = [faker.string.alphanumeric(64), faker.string.alphanumeric(64)];
  dto.titulo = faker.string.alphanumeric(10);
  dto.corpo = faker.string.alphanumeric(30);
  dto.dados = { gasto_id: faker.number.int().toString() };
  return Object.assign(dto, overrides);
}

function buildFirebaseResponse(
  responses: { success: boolean; errorCode?: string; errorMessage?: string }[],
) {
  return {
    responses: responses.map(({ success, errorCode, errorMessage }) => ({
      success,
      error: success
        ? undefined
        : {
            code: errorCode ?? "messaging/unknown",
            message: errorMessage ?? "erro",
          },
    })),
  };
}

let mockPrismaService: {
  tokenDispositivo: {
    deleteMany: jest.Mock;
  };
};

function createPrismaMock() {
  return {
    tokenDispositivo: {
      deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
  };
}

describe("TokensDispositivosNotificacaoService", () => {
  let service: TokensDispositivosNotificacaoService;
  let mockSendEachForMulticast: jest.Mock;

  beforeEach(async () => {
    jest.clearAllMocks();

    mockPrismaService = createPrismaMock();

    mockSendEachForMulticast = jest.fn();
    (admin.messaging as jest.Mock).mockReturnValue({
      sendEachForMulticast: mockSendEachForMulticast,
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokensDispositivosNotificacaoService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<TokensDispositivosNotificacaoService>(
      TokensDispositivosNotificacaoService,
    );
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("enviar", () => {
    it("should not call firebase when tokens list is empty", async () => {
      const dto = buildNotificacaoDto({ tokens: [] });

      await service.enviar(dto);

      expect(mockSendEachForMulticast).not.toHaveBeenCalled();
    });

    it("should call firebase sendEachForMulticast with correct payload", async () => {
      const dto = buildNotificacaoDto();
      const gastoId = dto.dados?.gasto_id;

      mockSendEachForMulticast.mockResolvedValue(
        buildFirebaseResponse(dto.tokens.map(() => ({ success: true }))),
      );

      await service.enviar(dto);

      expect(mockSendEachForMulticast).toHaveBeenCalledWith({
        tokens: dto.tokens,
        notification: {
          title: dto.titulo,
          body: dto.corpo,
        },
        data: dto.dados,
        android: {
          priority: "high",
          collapseKey: `gasto_${gastoId}`,
          notification: {
            sound: "default",
            tag: `gasto_${gastoId}`,
          },
        },
        apns: {
          headers: {
            "apns-collapse-id": `gasto_${gastoId}`,
          },
          payload: {
            aps: { sound: "default", badge: 1 },
          },
        },
      });
    });

    it("should not delete tokens when all notifications succeed", async () => {
      const dto = buildNotificacaoDto();

      mockSendEachForMulticast.mockResolvedValue(
        buildFirebaseResponse(dto.tokens.map(() => ({ success: true }))),
      );

      await service.enviar(dto);

      expect(
        mockPrismaService.tokenDispositivo.deleteMany,
      ).not.toHaveBeenCalled();
    });

    it("should delete expired tokens when error code is invalid-registration-token", async () => {
      const tokenExpirado = faker.string.alphanumeric(64);
      const tokenValido = faker.string.alphanumeric(64);

      const dto = buildNotificacaoDto({ tokens: [tokenExpirado, tokenValido] });

      mockSendEachForMulticast.mockResolvedValue(
        buildFirebaseResponse([
          { success: false, errorCode: "messaging/invalid-registration-token" },
          { success: true },
        ]),
      );

      await service.enviar(dto);

      expect(
        mockPrismaService.tokenDispositivo.deleteMany,
      ).toHaveBeenCalledWith({
        where: { token: { in: [tokenExpirado] } },
      });
    });

    it("should delete expired tokens when error code is registration-token-not-registered", async () => {
      const tokenExpirado = faker.string.alphanumeric(64);
      const dto = buildNotificacaoDto({ tokens: [tokenExpirado] });

      mockSendEachForMulticast.mockResolvedValue(
        buildFirebaseResponse([
          {
            success: false,
            errorCode: "messaging/registration-token-not-registered",
          },
        ]),
      );

      await service.enviar(dto);

      expect(
        mockPrismaService.tokenDispositivo.deleteMany,
      ).toHaveBeenCalledWith({
        where: { token: { in: [tokenExpirado] } },
      });
    });

    it("should delete all expired tokens in a single deleteMany call", async () => {
      const token1 = faker.string.alphanumeric(64);
      const token2 = faker.string.alphanumeric(64);
      const tokenValido = faker.string.alphanumeric(64);

      const dto = buildNotificacaoDto({
        tokens: [token1, token2, tokenValido],
      });

      mockSendEachForMulticast.mockResolvedValue(
        buildFirebaseResponse([
          { success: false, errorCode: "messaging/invalid-registration-token" },
          {
            success: false,
            errorCode: "messaging/registration-token-not-registered",
          },
          { success: true },
        ]),
      );

      await service.enviar(dto);

      expect(
        mockPrismaService.tokenDispositivo.deleteMany,
      ).toHaveBeenCalledTimes(1);
      expect(
        mockPrismaService.tokenDispositivo.deleteMany,
      ).toHaveBeenCalledWith({
        where: { token: { in: [token1, token2] } },
      });
    });

    it("should not delete tokens when failure is not due to expiration", async () => {
      const dto = buildNotificacaoDto({
        tokens: [faker.string.alphanumeric(64)],
      });

      mockSendEachForMulticast.mockResolvedValue(
        buildFirebaseResponse([
          {
            success: false,
            errorCode: "messaging/internal-error",
            errorMessage: "erro interno",
          },
        ]),
      );

      await service.enviar(dto);

      expect(
        mockPrismaService.tokenDispositivo.deleteMany,
      ).not.toHaveBeenCalled();
    });

    it("should delete only expired tokens and keep other failures intact", async () => {
      const tokenExpirado = faker.string.alphanumeric(64);
      const tokenComOutroErro = faker.string.alphanumeric(64);

      const dto = buildNotificacaoDto({
        tokens: [tokenExpirado, tokenComOutroErro],
      });

      mockSendEachForMulticast.mockResolvedValue(
        buildFirebaseResponse([
          { success: false, errorCode: "messaging/invalid-registration-token" },
          { success: false, errorCode: "messaging/internal-error" },
        ]),
      );

      await service.enviar(dto);

      expect(
        mockPrismaService.tokenDispositivo.deleteMany,
      ).toHaveBeenCalledWith({
        where: { token: { in: [tokenExpirado] } },
      });
    });
  });
});

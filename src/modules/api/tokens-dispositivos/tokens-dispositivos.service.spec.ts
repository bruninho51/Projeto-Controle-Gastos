import { Test, TestingModule } from "@nestjs/testing";
import { TokensDispositivosService } from "./tokens-dispositivos.service";
import { PrismaService } from "../../prisma/prisma.service";
import { TokenDispositivoUpsertDto } from "./dtos/TokenDispositivoUpsert.dto";
import { TokenDispositivoResponseDto } from "./dtos/TokenDispositivoResponse.dto";
import { TokenDispositivo } from "@prisma/client";
import { faker } from "@faker-js/faker";

function buildTokenDispositivo(
  overrides: Partial<TokenDispositivo> = {},
): TokenDispositivo {
  return {
    id: faker.number.int(),
    token: faker.string.alphanumeric(64),
    usuario_id: faker.number.int(),
    plataforma: faker.helpers.arrayElement(["android", "ios", "web"]),
    data_criacao: new Date(),
    data_atualizacao: new Date(),
    ...overrides,
  };
}

function toResponseDto(entity: TokenDispositivo): TokenDispositivoResponseDto {
  const dto = new TokenDispositivoResponseDto();
  dto.id = entity.id;
  dto.token = entity.token;
  dto.usuario_id = entity.usuario_id;
  dto.plataforma = entity.plataforma;
  dto.data_criacao = entity.data_criacao;
  dto.data_atualizacao = entity.data_atualizacao;
  return dto;
}

let mockPrismaService: {
  tokenDispositivo: {
    upsert: jest.Mock;
    findMany: jest.Mock;
    findUnique: jest.Mock;
    delete: jest.Mock;
  };
};

function createPrismaMock() {
  return {
    tokenDispositivo: {
      upsert: jest.fn().mockResolvedValue(null),
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn().mockResolvedValue(null),
      delete: jest.fn().mockResolvedValue(null),
    },
  };
}

describe("TokensDispositivosService", () => {
  let service: TokensDispositivosService;

  beforeEach(async () => {
    jest.clearAllMocks();

    mockPrismaService = createPrismaMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokensDispositivosService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<TokensDispositivosService>(TokensDispositivosService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("upsert", () => {
    it("should create a new token de dispositivo when token does not exist", async () => {
      const usuario_id = faker.number.int();

      const upsertDto: TokenDispositivoUpsertDto = {
        token: faker.string.alphanumeric(64),
        plataforma: "android",
      };

      const createdToken = buildTokenDispositivo({
        token: upsertDto.token,
        plataforma: upsertDto.plataforma,
        usuario_id,
      });

      mockPrismaService.tokenDispositivo.upsert.mockResolvedValue(createdToken);

      const result = await service.upsert(usuario_id, upsertDto);

      expect(result).toStrictEqual(toResponseDto(createdToken));
      expect(mockPrismaService.tokenDispositivo.upsert).toHaveBeenCalledWith({
        where: { token: upsertDto.token },
        update: {
          usuario_id,
          plataforma: upsertDto.plataforma,
          data_atualizacao: expect.any(Date),
        },
        create: {
          token: upsertDto.token,
          usuario_id,
          plataforma: upsertDto.plataforma,
        },
      });
    });

    it("should update an existing token de dispositivo when token already exists", async () => {
      const usuario_id = faker.number.int();

      const upsertDto: TokenDispositivoUpsertDto = {
        token: faker.string.alphanumeric(64),
        plataforma: "ios",
      };

      const updatedToken = buildTokenDispositivo({
        token: upsertDto.token,
        plataforma: upsertDto.plataforma,
        usuario_id,
        data_atualizacao: new Date(),
      });

      mockPrismaService.tokenDispositivo.upsert.mockResolvedValue(updatedToken);

      const result = await service.upsert(usuario_id, upsertDto);

      expect(result).toStrictEqual(toResponseDto(updatedToken));
      expect(mockPrismaService.tokenDispositivo.upsert).toHaveBeenCalledWith({
        where: { token: upsertDto.token },
        update: {
          usuario_id,
          plataforma: upsertDto.plataforma,
          data_atualizacao: expect.any(Date),
        },
        create: {
          token: upsertDto.token,
          usuario_id,
          plataforma: upsertDto.plataforma,
        },
      });
    });

    it("should use token as unique key for upsert", async () => {
      const usuario_id = faker.number.int();
      const token = faker.string.alphanumeric(64);

      const upsertDto: TokenDispositivoUpsertDto = {
        token,
        plataforma: "web",
      };

      mockPrismaService.tokenDispositivo.upsert.mockResolvedValue(
        buildTokenDispositivo({ token, usuario_id }),
      );

      await service.upsert(usuario_id, upsertDto);

      const call = mockPrismaService.tokenDispositivo.upsert.mock.calls[0][0];
      expect(call.where).toStrictEqual({ token });
    });
  });

  describe("findAll", () => {
    it("should return an array of tokens de dispositivos do usuário", async () => {
      const usuario_id = faker.number.int();

      const tokens = [
        buildTokenDispositivo({ usuario_id }),
        buildTokenDispositivo({ usuario_id }),
      ];

      mockPrismaService.tokenDispositivo.findMany.mockResolvedValue(tokens);

      const result = await service.findAll(usuario_id);

      expect(result).toStrictEqual(tokens.map(toResponseDto));
      expect(mockPrismaService.tokenDispositivo.findMany).toHaveBeenCalledWith({
        where: { usuario_id },
      });
    });

    it("should return an empty array when user has no tokens", async () => {
      const usuario_id = faker.number.int();

      mockPrismaService.tokenDispositivo.findMany.mockResolvedValue([]);

      const result = await service.findAll(usuario_id);

      expect(result).toStrictEqual([]);
      expect(mockPrismaService.tokenDispositivo.findMany).toHaveBeenCalledWith({
        where: { usuario_id },
      });
    });

    it("should filter tokens by usuario_id", async () => {
      const usuario_id = faker.number.int();

      mockPrismaService.tokenDispositivo.findMany.mockResolvedValue([]);

      await service.findAll(usuario_id);

      expect(mockPrismaService.tokenDispositivo.findMany).toHaveBeenCalledWith({
        where: { usuario_id },
      });
    });
  });

  describe("findOne", () => {
    it("should return a single token de dispositivo by id", async () => {
      const usuario_id = faker.number.int();
      const id = faker.number.int();
      const token = buildTokenDispositivo({ id, usuario_id });

      mockPrismaService.tokenDispositivo.findUnique.mockResolvedValue(token);

      const result = await service.findOne(usuario_id, id);

      expect(result).toStrictEqual(toResponseDto(token));
      expect(mockPrismaService.tokenDispositivo.findUnique).toHaveBeenCalledWith({
        where: { id, usuario_id },
      });
    });

    it("should return null if token de dispositivo not found", async () => {
      mockPrismaService.tokenDispositivo.findUnique.mockResolvedValue(null);

      const result = await service.findOne(faker.number.int(), faker.number.int());

      expect(result).toBeNull();
    });

    it("should scope query by usuario_id", async () => {
      const usuario_id = faker.number.int();
      const id = faker.number.int();

      mockPrismaService.tokenDispositivo.findUnique.mockResolvedValue(null);

      await service.findOne(usuario_id, id);

      expect(mockPrismaService.tokenDispositivo.findUnique).toHaveBeenCalledWith({
        where: { id, usuario_id },
      });
    });
  });

  describe("remove", () => {
    it("should delete a token de dispositivo", async () => {
      const usuario_id = faker.number.int();
      const id = faker.number.int();
      const deletedToken = buildTokenDispositivo({ id, usuario_id });

      mockPrismaService.tokenDispositivo.delete.mockResolvedValue(deletedToken);

      const result = await service.remove(usuario_id, id);

      expect(result).toStrictEqual(toResponseDto(deletedToken));
      expect(mockPrismaService.tokenDispositivo.delete).toHaveBeenCalledWith({
        where: { id, usuario_id },
      });
    });

    it("should scope delete by usuario_id", async () => {
      const usuario_id = faker.number.int();
      const id = faker.number.int();

      mockPrismaService.tokenDispositivo.delete.mockResolvedValue(
        buildTokenDispositivo({ id, usuario_id }),
      );

      await service.remove(usuario_id, id);

      expect(mockPrismaService.tokenDispositivo.delete).toHaveBeenCalledWith({
        where: { id, usuario_id },
      });
    });
  });
});
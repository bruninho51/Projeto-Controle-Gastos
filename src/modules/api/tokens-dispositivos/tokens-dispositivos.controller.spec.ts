import { Test, TestingModule } from "@nestjs/testing";
import { TokensDispositivosController } from "./tokens-dispositivos.controller";
import { TokensDispositivosService } from "./tokens-dispositivos.service";
import { TokenDispositivoUpsertDto } from "./dtos/TokenDispositivoUpsert.dto";
import { TokenDispositivoResponseDto } from "./dtos/TokenDispositivoResponse.dto";
import { NotFoundException } from "@nestjs/common";
import { faker } from "@faker-js/faker";

function buildRequest(usuarioId: number = faker.number.int()) {
  return { user: { id: usuarioId } };
}

function buildUpsertDto(
  overrides: Partial<TokenDispositivoUpsertDto> = {},
): TokenDispositivoUpsertDto {
  return {
    token: faker.string.alphanumeric(64),
    plataforma: faker.helpers.arrayElement(["android", "ios", "web"]),
    ...overrides,
  };
}

function buildTokenDispositivoResponseDto(
  overrides: Partial<TokenDispositivoResponseDto> = {},
): TokenDispositivoResponseDto {
  const dto = new TokenDispositivoResponseDto();
  dto.id = faker.number.int();
  dto.token = faker.string.alphanumeric(64);
  dto.usuario_id = faker.number.int();
  dto.plataforma = faker.helpers.arrayElement(["android", "ios", "web"]);
  dto.data_criacao = new Date();
  dto.data_atualizacao = new Date();
  return Object.assign(dto, overrides);
}

const mockTokensDispositivosService = {
  upsert: jest.fn().mockResolvedValue(null),
  findAll: jest.fn().mockResolvedValue([]),
  findOne: jest.fn().mockResolvedValue(null),
  remove: jest.fn().mockResolvedValue(null),
};

describe("TokensDispositivosController", () => {
  let controller: TokensDispositivosController;
  let service: TokensDispositivosService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TokensDispositivosController],
      providers: [
        {
          provide: TokensDispositivosService,
          useValue: mockTokensDispositivosService,
        },
      ],
    }).compile();

    controller = module.get<TokensDispositivosController>(
      TokensDispositivosController,
    );
    service = module.get<TokensDispositivosService>(TokensDispositivosService);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("upsert", () => {
    it("should create a new token de dispositivo", async () => {
      const req = buildRequest();
      const dto = buildUpsertDto();
      const createdToken = buildTokenDispositivoResponseDto({
        token: dto.token,
        plataforma: dto.plataforma,
        usuario_id: req.user.id,
      });

      mockTokensDispositivosService.upsert.mockResolvedValue(createdToken);

      const result = await controller.upsert(req, dto);

      expect(result).toStrictEqual(createdToken);
      expect(service.upsert).toHaveBeenCalledWith(req.user.id, dto);
    });

    it("should update an existing token de dispositivo", async () => {
      const req = buildRequest();
      const dto = buildUpsertDto();
      const updatedToken = buildTokenDispositivoResponseDto({
        token: dto.token,
        plataforma: dto.plataforma,
        usuario_id: req.user.id,
        data_atualizacao: new Date(),
      });

      mockTokensDispositivosService.upsert.mockResolvedValue(updatedToken);

      const result = await controller.upsert(req, dto);

      expect(result).toStrictEqual(updatedToken);
      expect(service.upsert).toHaveBeenCalledWith(req.user.id, dto);
    });

    it("should call service with correct usuario_id from JWT", async () => {
      const req = buildRequest();
      const dto = buildUpsertDto();

      mockTokensDispositivosService.upsert.mockResolvedValue(
        buildTokenDispositivoResponseDto(),
      );

      await controller.upsert(req, dto);

      expect(service.upsert).toHaveBeenCalledWith(req.user.id, dto);
    });
  });

  describe("findAll", () => {
    it("should return an array of tokens de dispositivos", async () => {
      const req = buildRequest();
      const tokens: TokenDispositivoResponseDto[] = [
        buildTokenDispositivoResponseDto({ usuario_id: req.user.id }),
        buildTokenDispositivoResponseDto({ usuario_id: req.user.id }),
      ];

      mockTokensDispositivosService.findAll.mockResolvedValue(tokens);

      const result = await controller.findAll(req);

      expect(result).toStrictEqual(tokens);
      expect(service.findAll).toHaveBeenCalledWith(req.user.id);
    });

    it("should return an empty array when user has no tokens", async () => {
      const req = buildRequest();

      mockTokensDispositivosService.findAll.mockResolvedValue([]);

      const result = await controller.findAll(req);

      expect(result).toStrictEqual([]);
      expect(service.findAll).toHaveBeenCalledWith(req.user.id);
    });

    it("should call service with correct usuario_id from JWT", async () => {
      const req = buildRequest();

      mockTokensDispositivosService.findAll.mockResolvedValue([]);

      await controller.findAll(req);

      expect(service.findAll).toHaveBeenCalledWith(req.user.id);
    });
  });

  describe("findOne", () => {
    it("should return a token de dispositivo by id", async () => {
      const req = buildRequest();
      const id = faker.number.int();
      const token = buildTokenDispositivoResponseDto({
        id,
        usuario_id: req.user.id,
      });

      mockTokensDispositivosService.findOne.mockResolvedValue(token);

      const result = await controller.findOne(req, id);

      expect(result).toStrictEqual(token);
      expect(service.findOne).toHaveBeenCalledWith(req.user.id, id);
    });

    it("should throw NotFoundException if token de dispositivo not found", async () => {
      const req = buildRequest();
      const id = faker.number.int();

      mockTokensDispositivosService.findOne.mockResolvedValue(null);

      await expect(controller.findOne(req, id)).rejects.toThrow(
        new NotFoundException(
          "O token de dispositivo informado não foi encontrado.",
        ),
      );
    });

    it("should call service with correct usuario_id and id", async () => {
      const req = buildRequest();
      const id = faker.number.int();
      const token = buildTokenDispositivoResponseDto({ id });

      mockTokensDispositivosService.findOne.mockResolvedValue(token);

      await controller.findOne(req, id);

      expect(service.findOne).toHaveBeenCalledWith(req.user.id, id);
    });
  });

  describe("remove", () => {
    it("should remove a token de dispositivo", async () => {
      const req = buildRequest();
      const id = faker.number.int();
      const token = buildTokenDispositivoResponseDto({
        id,
        usuario_id: req.user.id,
      });

      mockTokensDispositivosService.findOne.mockResolvedValue(token);
      mockTokensDispositivosService.remove.mockResolvedValue(token);

      const result = await controller.remove(req, id);

      expect(result).toStrictEqual(token);
      expect(service.remove).toHaveBeenCalledWith(req.user.id, id);
    });

    it("should throw NotFoundException if token de dispositivo not found", async () => {
      const req = buildRequest();
      const id = faker.number.int();

      mockTokensDispositivosService.findOne.mockResolvedValue(null);

      await expect(controller.remove(req, id)).rejects.toThrow(
        new NotFoundException(
          "O token de dispositivo informado não foi encontrado.",
        ),
      );
    });

    it("should call findOne before removing", async () => {
      const req = buildRequest();
      const id = faker.number.int();
      const token = buildTokenDispositivoResponseDto({ id });

      mockTokensDispositivosService.findOne.mockResolvedValue(token);
      mockTokensDispositivosService.remove.mockResolvedValue(token);

      await controller.remove(req, id);

      expect(service.findOne).toHaveBeenCalledWith(req.user.id, id);
      expect(service.remove).toHaveBeenCalledWith(req.user.id, id);
    });

    it("should not call remove if token de dispositivo not found", async () => {
      const req = buildRequest();
      const id = faker.number.int();

      mockTokensDispositivosService.findOne.mockResolvedValue(null);

      await expect(controller.remove(req, id)).rejects.toThrow(
        NotFoundException,
      );

      expect(service.remove).not.toHaveBeenCalled();
    });
  });
});

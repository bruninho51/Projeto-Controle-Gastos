import { Test, TestingModule } from "@nestjs/testing";
import { OrcamentosController } from "./orcamentos.controller";
import { OrcamentosService } from "./orcamentos.service";
import { OrcamentoCreateDto } from "./dtos/OrcamentoCreate.dto";
import { OrcamentoUpdateDto } from "./dtos/OrcamentoUpdate.dto";
import { OrcamentoResponseDto } from "./dtos/OrcamentoResponse.dto";
import { OrcamentoFindDto } from "./dtos/OrcamentoFind.dto";
import { faker } from "@faker-js/faker";

function buildRequest(usuarioId: number = faker.number.int()) {
  return { user: { id: usuarioId } };
}

function buildCreateDto(
  overrides: Partial<OrcamentoCreateDto> = {},
): OrcamentoCreateDto {
  return {
    nome: faker.string.alphanumeric(8),
    valor_inicial: faker.number
      .float({ min: 100, max: 9999, fractionDigits: 2 })
      .toString(),
    ...overrides,
  };
}

function buildUpdateDto(
  overrides: Partial<OrcamentoUpdateDto> = {},
): OrcamentoUpdateDto {
  return {
    nome: faker.string.alphanumeric(8),
    valor_inicial: faker.number
      .float({ min: 100, max: 9999, fractionDigits: 2 })
      .toString(),
    ...overrides,
  };
}

function buildOrcamentoResponseDto(
  overrides: Partial<OrcamentoResponseDto> = {},
): OrcamentoResponseDto {
  return new OrcamentoResponseDto({
    id: faker.number.int(),
    nome: faker.string.alphanumeric(8),
    valor_inicial: faker.number
      .float({ min: 100, max: 9999, fractionDigits: 2 })
      .toString(),
    valor_atual: faker.number
      .float({ min: 100, max: 9999, fractionDigits: 2 })
      .toString(),
    valor_livre: faker.number
      .float({ min: 100, max: 9999, fractionDigits: 2 })
      .toString(),
    data_encerramento: null,
    data_criacao: new Date(),
    data_atualizacao: new Date(),
    ...overrides,
  });
}

let mockOrcamentosService: {
  create: jest.Mock;
  findAll: jest.Mock;
  findOne: jest.Mock;
  update: jest.Mock;
  softDelete: jest.Mock;
};

function createServiceMock() {
  return {
    create: jest.fn().mockResolvedValue(null),
    findAll: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue(null),
    update: jest.fn().mockResolvedValue(null),
    softDelete: jest.fn().mockResolvedValue(null),
  };
}

describe("OrcamentosController", () => {
  let controller: OrcamentosController;
  let service: OrcamentosService;

  beforeEach(async () => {
    jest.clearAllMocks();

    mockOrcamentosService = createServiceMock();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrcamentosController],
      providers: [
        OrcamentosService,
        { provide: OrcamentosService, useValue: mockOrcamentosService },
      ],
    }).compile();

    controller = module.get<OrcamentosController>(OrcamentosController);
    service = module.get<OrcamentosService>(OrcamentosService);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("create", () => {
    it("should create a new orcamento", async () => {
      const req = buildRequest();
      const dto = buildCreateDto();
      const created = buildOrcamentoResponseDto({ nome: dto.nome });

      mockOrcamentosService.create.mockResolvedValue(created);

      const result = await controller.create(req, dto);

      expect(result).toEqual(created);
      expect(service.create).toHaveBeenCalledWith(req.user.id, dto);
    });
  });

  describe("findAll", () => {
    it("should return an array of orcamentos", async () => {
      const req = buildRequest();
      const filters: OrcamentoFindDto = {};
      const orcamentos = [
        buildOrcamentoResponseDto(),
        buildOrcamentoResponseDto(),
      ];

      mockOrcamentosService.findAll.mockResolvedValue(orcamentos);

      const result = await controller.findAll(req, filters);

      expect(result).toEqual(orcamentos);
      expect(service.findAll).toHaveBeenCalledWith(req.user.id, filters);
    });

    it("should pass filters to service", async () => {
      const req = buildRequest();
      const filters: OrcamentoFindDto = {
        nome: faker.string.alpha(8),
        encerrado: true,
        inativo: false,
      };

      mockOrcamentosService.findAll.mockResolvedValue([]);

      await controller.findAll(req, filters);

      expect(service.findAll).toHaveBeenCalledWith(req.user.id, filters);
    });
  });

  describe("findOne", () => {
    it("should return a single orcamento by id", async () => {
      const req = buildRequest();
      const orcamento_id = faker.number.int();
      const orcamento = buildOrcamentoResponseDto({ id: orcamento_id });

      mockOrcamentosService.findOne.mockResolvedValue(orcamento);

      const result = await controller.findOne(req, orcamento_id);

      expect(result).toEqual(orcamento);
      expect(service.findOne).toHaveBeenCalledWith(req.user.id, orcamento_id);
    });

    it("should return null if orcamento not found", async () => {
      const req = buildRequest();

      mockOrcamentosService.findOne.mockResolvedValue(null);

      const result = await controller.findOne(req, 999);

      expect(result).toBeNull();
      expect(service.findOne).toHaveBeenCalledWith(req.user.id, 999);
    });
  });

  describe("update", () => {
    it("should update an orcamento", async () => {
      const req = buildRequest();
      const orcamento_id = faker.number.int();
      const dto = buildUpdateDto();
      const updated = buildOrcamentoResponseDto({
        id: orcamento_id,
        nome: dto.nome,
      });

      mockOrcamentosService.update.mockResolvedValue(updated);

      const result = await controller.update(req, orcamento_id, dto);

      expect(result).toEqual(updated);
      expect(service.update).toHaveBeenCalledWith(
        req.user.id,
        orcamento_id,
        dto,
      );
    });
  });

  describe("remove", () => {
    it("should perform a soft delete of an orcamento", async () => {
      const req = buildRequest();
      const orcamento_id = faker.number.int();
      const deleted = buildOrcamentoResponseDto({ id: orcamento_id });

      mockOrcamentosService.softDelete.mockResolvedValue(deleted);

      const result = await controller.remove(req, orcamento_id);

      expect(result).toEqual(deleted);
      expect(service.softDelete).toHaveBeenCalledWith(
        req.user.id,
        orcamento_id,
      );
    });
  });
});

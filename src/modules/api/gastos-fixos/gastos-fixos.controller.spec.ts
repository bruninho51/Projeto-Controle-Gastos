import { Test, TestingModule } from "@nestjs/testing";
import { GastosFixosController } from "./gastos-fixos.controller";
import { GastosFixosService } from "./gastos-fixos.service";
import { GastoFixoCreateDto } from "./dtos/GastoFixoCreate.dto";
import { GastoFixoUpdateDto } from "./dtos/GastoFixoUpdate.dto";
import { GastoFixoResponseDto } from "./dtos/GastoFixoResponse.dto";
import { GastoFixoFindDto } from "./dtos/GastoFixoFind.dto";
import { CategoriaGastoResponseDto } from "../categorias-gastos/dtos/CategoriaGastoResponse.dto";
import { faker } from "@faker-js/faker";
import { OrcamentosService } from "../orcamentos/orcamentos.service";
import { NotFoundException } from "@nestjs/common";
import { CategoriasGastosService } from "../categorias-gastos/categorias-gastos.service";

function buildRequest(usuarioId: number = faker.number.int()) {
  return { user: { id: usuarioId } };
}

function buildCreateDto(
  overrides: Partial<GastoFixoCreateDto> = {},
): GastoFixoCreateDto {
  return {
    descricao: faker.string.alphanumeric(5),
    observacoes: faker.string.alphanumeric(5),
    categoria_id: faker.number.int(),
    data_venc: faker.date.future(),
    previsto: faker.number
      .float({ min: 100, max: 9999, fractionDigits: 2 })
      .toString(),
    ...overrides,
  };
}

function buildUpdateDto(
  overrides: Partial<GastoFixoUpdateDto> = {},
): GastoFixoUpdateDto {
  return {
    descricao: faker.string.alphanumeric(5),
    previsto: faker.number
      .float({ min: 100, max: 9999, fractionDigits: 2 })
      .toString(),
    ...overrides,
  };
}

function buildCategoriaResponseDto(
  overrides: Partial<CategoriaGastoResponseDto> = {},
): CategoriaGastoResponseDto {
  return new CategoriaGastoResponseDto({
    id: faker.number.int(),
    nome: faker.string.alphanumeric(8),
    data_criacao: new Date(),
    data_atualizacao: new Date(),
    data_inatividade: null,
    ...overrides,
  });
}

function buildGastoFixoResponseDto(
  overrides: Partial<GastoFixoResponseDto> = {},
): GastoFixoResponseDto {
  return new GastoFixoResponseDto({
    id: faker.number.int(),
    descricao: faker.string.alphanumeric(5),
    previsto: faker.number
      .float({ min: 100, max: 9999, fractionDigits: 2 })
      .toString(),
    valor: null,
    diferenca: null,
    categoria_id: faker.number.int(),
    orcamento_id: faker.number.int(),
    data_venc: faker.date.future(),
    data_pgto: null,
    observacoes: null,
    data_criacao: new Date(),
    data_atualizacao: new Date(),
    data_inatividade: null,
    categoriaGasto: buildCategoriaResponseDto(),
    ...overrides,
  });
}

// OrcamentosService não expõe um DTO público nos arquivos fornecidos,
// então tipamos apenas o subconjunto usado pelo controller.
function buildOrcamentoDto(overrides: { id?: number } = {}): { id: number } {
  return { id: faker.number.int(), ...overrides };
}

const mockGastosFixosService = {
  create: jest.fn().mockResolvedValue(null),
  findAll: jest.fn().mockResolvedValue([]),
  findOne: jest.fn().mockResolvedValue(null),
  update: jest.fn().mockResolvedValue(null),
  softDelete: jest.fn().mockResolvedValue(null),
};

const mockOrcamentosService = {
  create: jest.fn().mockResolvedValue(null),
  findAll: jest.fn().mockResolvedValue([]),
  findOne: jest.fn().mockResolvedValue(null),
  update: jest.fn().mockResolvedValue(null),
  softDelete: jest.fn().mockResolvedValue(null),
};

const mockCategoriaGastosService = {
  findAll: jest.fn().mockResolvedValue([]),
  findOne: jest.fn().mockResolvedValue(null),
  create: jest.fn().mockResolvedValue(null),
  update: jest.fn().mockResolvedValue(null),
  softDelete: jest.fn().mockResolvedValue(null),
};

describe("GastosFixosController", () => {
  let controller: GastosFixosController;
  let service: GastosFixosService;
  let orcamentosService: OrcamentosService;
  let categoriaGastosService: CategoriasGastosService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [GastosFixosController],
      providers: [
        GastosFixosService,
        { provide: GastosFixosService, useValue: mockGastosFixosService },
        { provide: OrcamentosService, useValue: mockOrcamentosService },
        {
          provide: CategoriasGastosService,
          useValue: mockCategoriaGastosService,
        },
      ],
    }).compile();

    controller = module.get<GastosFixosController>(GastosFixosController);
    service = module.get<GastosFixosService>(GastosFixosService);
    orcamentosService = module.get<OrcamentosService>(OrcamentosService);
    categoriaGastosService = module.get<CategoriasGastosService>(
      CategoriasGastosService,
    );
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("create", () => {
    it("should create a new gasto fixo", async () => {
      const req = buildRequest();
      const orcamento_id = faker.number.int().toString();
      const dto = buildCreateDto();
      const orcamentoDto = buildOrcamentoDto();
      const categoriaDto = buildCategoriaResponseDto();
      const createdGasto = buildGastoFixoResponseDto();

      mockCategoriaGastosService.findOne.mockReturnValueOnce(categoriaDto);
      mockOrcamentosService.findOne.mockReturnValueOnce(orcamentoDto);
      mockGastosFixosService.create.mockResolvedValue(createdGasto);

      const result = await controller.create(req, orcamento_id, dto);

      expect(result).toStrictEqual(createdGasto);
      expect(service.create).toHaveBeenCalledWith(orcamentoDto.id, dto);
    });

    it("should call orcamentos service", async () => {
      const req = buildRequest();
      const orcamento_id = faker.number.int().toString();
      const dto = buildCreateDto();
      const orcamentoDto = buildOrcamentoDto();
      const categoriaDto = buildCategoriaResponseDto();

      mockCategoriaGastosService.findOne.mockReturnValueOnce(categoriaDto);
      mockOrcamentosService.findOne.mockReturnValueOnce(orcamentoDto);

      await controller.create(req, orcamento_id, dto);

      expect(orcamentosService.findOne).toHaveBeenCalledWith(
        req.user.id,
        +orcamento_id,
      );
    });

    it("should throw exception if orcamentos service returns null", async () => {
      const req = buildRequest();
      const orcamento_id = faker.number.int().toString();
      const dto = buildCreateDto();
      const categoriaDto = buildCategoriaResponseDto();

      mockCategoriaGastosService.findOne.mockReturnValueOnce(categoriaDto);
      mockOrcamentosService.findOne.mockReturnValueOnce(null);

      await expect(controller.create(req, orcamento_id, dto)).rejects.toThrow(
        new NotFoundException("O orçamento informado não foi encontrado."),
      );
    });

    it("should call categoria gasto service", async () => {
      const req = buildRequest();
      const orcamento_id = faker.number.int().toString();
      const dto = buildCreateDto();
      const orcamentoDto = buildOrcamentoDto();
      const categoriaDto = buildCategoriaResponseDto();

      mockCategoriaGastosService.findOne.mockReturnValueOnce(categoriaDto);
      mockOrcamentosService.findOne.mockReturnValueOnce(orcamentoDto);

      await controller.create(req, orcamento_id, dto);

      expect(categoriaGastosService.findOne).toHaveBeenCalledWith(
        req.user.id,
        +dto.categoria_id,
      );
    });

    it("should throw exception if categoria gasto service returns null", async () => {
      const req = buildRequest();
      const orcamento_id = faker.number.int().toString();
      const dto = buildCreateDto();
      const orcamentoDto = buildOrcamentoDto();

      mockCategoriaGastosService.findOne.mockReturnValueOnce(null);
      mockOrcamentosService.findOne.mockReturnValueOnce(orcamentoDto);

      await expect(controller.create(req, orcamento_id, dto)).rejects.toThrow(
        new NotFoundException("A categoria informada não foi encontrada."),
      );
    });
  });

  describe("findAll", () => {
    it("should return an array of gastos fixos", async () => {
      const req = buildRequest();
      const orcamento_id = faker.number.int().toString();
      const orcamentoDto = buildOrcamentoDto();
      const filters: GastoFixoFindDto = {};
      const gastos: GastoFixoResponseDto[] = [
        buildGastoFixoResponseDto(),
        buildGastoFixoResponseDto(),
      ];

      mockOrcamentosService.findOne.mockReturnValueOnce(orcamentoDto);
      mockGastosFixosService.findAll.mockResolvedValue(gastos);

      const result = await controller.findAll(req, orcamento_id, filters);

      expect(result).toStrictEqual(gastos);
      expect(service.findAll).toHaveBeenCalledWith(orcamentoDto.id, filters);
    });

    it("should call orcamentos service", async () => {
      const req = buildRequest();
      const orcamento_id = faker.number.int().toString();
      const orcamentoDto = buildOrcamentoDto();

      mockOrcamentosService.findOne.mockReturnValueOnce(orcamentoDto);

      await controller.findAll(req, orcamento_id, {});

      expect(orcamentosService.findOne).toHaveBeenCalledWith(
        req.user.id,
        +orcamento_id,
      );
    });

    it("should throw exception if orcamentos service returns null", async () => {
      const req = buildRequest();
      const orcamento_id = faker.number.int().toString();

      mockOrcamentosService.findOne.mockReturnValueOnce(null);

      await expect(controller.findAll(req, orcamento_id, {})).rejects.toThrow(
        new NotFoundException("O orçamento informado não foi encontrado."),
      );
    });
  });

  describe("findOne", () => {
    it("should return a gasto fixo by id", async () => {
      const req = buildRequest();
      const orcamento_id = faker.number.int().toString();
      const gasto_fixo_id = faker.number.int().toString();
      const orcamentoDto = buildOrcamentoDto();
      const gasto = buildGastoFixoResponseDto({ id: +gasto_fixo_id });

      mockOrcamentosService.findOne.mockReturnValueOnce(orcamentoDto);
      mockGastosFixosService.findOne.mockResolvedValue(gasto);

      const result = await controller.findOne(req, orcamento_id, gasto_fixo_id);

      expect(result).toStrictEqual(gasto);
    });

    it("should return null if gasto fixo not found", async () => {
      const req = buildRequest();
      const orcamento_id = faker.number.int().toString();
      const orcamentoDto = buildOrcamentoDto();

      mockOrcamentosService.findOne.mockReturnValueOnce(orcamentoDto);
      mockGastosFixosService.findOne.mockResolvedValue(null);

      const result = await controller.findOne(req, orcamento_id, "999");

      expect(result).toBeNull();
    });

    it("should call orcamentos service", async () => {
      const req = buildRequest();
      const orcamento_id = faker.number.int().toString();
      const gasto_fixo_id = faker.number.int().toString();
      const orcamentoDto = buildOrcamentoDto();

      mockOrcamentosService.findOne.mockReturnValueOnce(orcamentoDto);
      mockGastosFixosService.findOne.mockResolvedValue(null);

      await controller.findOne(req, orcamento_id, gasto_fixo_id);

      expect(orcamentosService.findOne).toHaveBeenCalledWith(
        req.user.id,
        +orcamento_id,
      );
    });

    it("should throw exception if orcamentos service returns null", async () => {
      const req = buildRequest();
      const orcamento_id = faker.number.int().toString();
      const gasto_fixo_id = faker.number.int().toString();

      mockOrcamentosService.findOne.mockReturnValueOnce(null);

      await expect(
        controller.findOne(req, orcamento_id, gasto_fixo_id),
      ).rejects.toThrow(
        new NotFoundException("O orçamento informado não foi encontrado."),
      );
    });
  });

  describe("update", () => {
    it("should update a gasto fixo", async () => {
      const req = buildRequest();
      const orcamento_id = faker.number.int().toString();
      const gasto_fixo_id = faker.number.int().toString();
      const dto = buildUpdateDto();
      const orcamentoDto = buildOrcamentoDto();
      const updatedGasto = buildGastoFixoResponseDto({ id: +gasto_fixo_id });

      mockOrcamentosService.findOne.mockReturnValueOnce(orcamentoDto);
      mockGastosFixosService.update.mockResolvedValue(updatedGasto);

      const result = await controller.update(
        req,
        orcamento_id,
        gasto_fixo_id,
        dto,
      );

      expect(result).toStrictEqual(updatedGasto);
      expect(service.update).toHaveBeenCalledWith(
        orcamentoDto.id,
        +gasto_fixo_id,
        dto,
      );
    });

    it("should call orcamentos service", async () => {
      const req = buildRequest();
      const orcamento_id = faker.number.int().toString();
      const gasto_fixo_id = faker.number.int().toString();
      const dto = buildUpdateDto();
      const orcamentoDto = buildOrcamentoDto();

      mockOrcamentosService.findOne.mockReturnValueOnce(orcamentoDto);

      await controller.update(req, orcamento_id, gasto_fixo_id, dto);

      expect(orcamentosService.findOne).toHaveBeenCalledWith(
        req.user.id,
        +orcamento_id,
      );
    });

    it("should throw exception if orcamentos service returns null", async () => {
      const req = buildRequest();
      const orcamento_id = faker.number.int().toString();
      const gasto_fixo_id = faker.number.int().toString();
      const dto = buildUpdateDto({ data_venc: faker.date.future() });

      mockOrcamentosService.findOne.mockReturnValueOnce(null);

      await expect(
        controller.update(req, orcamento_id, gasto_fixo_id, dto),
      ).rejects.toThrow(
        new NotFoundException("O orçamento informado não foi encontrado."),
      );
    });
  });

  describe("remove", () => {
    it("should perform a soft delete of a gasto fixo", async () => {
      const req = buildRequest();
      const orcamento_id = faker.number.int().toString();
      const gasto_fixo_id = faker.number.int().toString();
      const orcamentoDto = buildOrcamentoDto();
      const deletedGasto = buildGastoFixoResponseDto({ id: +gasto_fixo_id });

      mockOrcamentosService.findOne.mockReturnValueOnce(orcamentoDto);
      mockGastosFixosService.softDelete.mockResolvedValue(deletedGasto);

      const result = await controller.remove(req, orcamento_id, gasto_fixo_id);

      expect(result).toStrictEqual(deletedGasto);
      expect(service.softDelete).toHaveBeenCalledWith(
        orcamentoDto.id,
        +gasto_fixo_id,
      );
    });

    it("should call orcamentos service", async () => {
      const req = buildRequest();
      const orcamento_id = faker.number.int().toString();
      const gasto_fixo_id = faker.number.int().toString();
      const orcamentoDto = buildOrcamentoDto();

      mockOrcamentosService.findOne.mockReturnValueOnce(orcamentoDto);

      await controller.remove(req, orcamento_id, gasto_fixo_id);

      expect(orcamentosService.findOne).toHaveBeenCalledWith(
        req.user.id,
        +orcamento_id,
      );
    });

    it("should throw exception if orcamentos service returns null", async () => {
      const req = buildRequest();
      const orcamento_id = faker.number.int().toString();
      const gasto_fixo_id = faker.number.int().toString();

      mockOrcamentosService.findOne.mockReturnValueOnce(null);

      await expect(
        controller.remove(req, orcamento_id, gasto_fixo_id),
      ).rejects.toThrow(
        new NotFoundException("O orçamento informado não foi encontrado."),
      );
    });
  });
});

import { Test, TestingModule } from "@nestjs/testing";
import { GastosVariadosController } from "./gastos-variados.controller";
import { GastosVariadosService } from "./gastos-variados.service";
import { GastoVariadoCreateDto } from "./dtos/GastoVariadoCreate.dto";
import { GastoVariadoUpdateDto } from "./dtos/GastoVariadoUpdate.dto";
import { GastoVariadoResponseDto } from "./dtos/GastoVariadoResponse.dto";
import { GastoVariadoFindDto } from "./dtos/GastoVariadoFind.dto";
import { CategoriaGastoResponseDto } from "../categorias-gastos/dtos/CategoriaGastoResponse.dto";
import { faker } from "@faker-js/faker";
import { OrcamentosService } from "../orcamentos/orcamentos.service";
import { NotFoundException } from "@nestjs/common";
import { CategoriasGastosService } from "../categorias-gastos/categorias-gastos.service";

function buildRequest(usuarioId: number = faker.number.int()) {
  return { user: { id: usuarioId } };
}

function buildCreateDto(
  overrides: Partial<GastoVariadoCreateDto> = {},
): GastoVariadoCreateDto {
  return {
    descricao: faker.string.alphanumeric(5),
    observacoes: faker.string.alphanumeric(5),
    categoria_id: faker.number.int(),
    valor: faker.number
      .float({ min: 100, max: 9999, fractionDigits: 2 })
      .toString(),
    data_pgto: new Date(),
    ...overrides,
  };
}

function buildUpdateDto(
  overrides: Partial<GastoVariadoUpdateDto> = {},
): GastoVariadoUpdateDto {
  return {
    descricao: faker.string.alphanumeric(5),
    valor: faker.number
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

function buildGastoVariadoResponseDto(
  overrides: Partial<GastoVariadoResponseDto> = {},
): GastoVariadoResponseDto {
  return new GastoVariadoResponseDto({
    id: faker.number.int(),
    descricao: faker.string.alphanumeric(5),
    valor: faker.number
      .float({ min: 100, max: 9999, fractionDigits: 2 })
      .toString(),
    categoria_id: faker.number.int(),
    orcamento_id: faker.number.int(),
    data_pgto: new Date(),
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

const mockGastosVariadosService = {
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

describe("GastosVariadosController", () => {
  let controller: GastosVariadosController;
  let service: GastosVariadosService;
  let orcamentosService: OrcamentosService;
  let categoriaGastosService: CategoriasGastosService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [GastosVariadosController],
      providers: [
        GastosVariadosService,
        { provide: GastosVariadosService, useValue: mockGastosVariadosService },
        { provide: OrcamentosService, useValue: mockOrcamentosService },
        {
          provide: CategoriasGastosService,
          useValue: mockCategoriaGastosService,
        },
      ],
    }).compile();

    controller = module.get<GastosVariadosController>(GastosVariadosController);
    service = module.get<GastosVariadosService>(GastosVariadosService);
    orcamentosService = module.get<OrcamentosService>(OrcamentosService);
    categoriaGastosService = module.get<CategoriasGastosService>(
      CategoriasGastosService,
    );
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("create", () => {
    it("should create a new gasto variado", async () => {
      const req = buildRequest();
      const orcamento_id = faker.number.int();
      const dto = buildCreateDto();
      const orcamentoDto = buildOrcamentoDto();
      const categoriaDto = buildCategoriaResponseDto();
      const createdGasto = buildGastoVariadoResponseDto();

      mockCategoriaGastosService.findOne.mockReturnValueOnce(categoriaDto);
      mockOrcamentosService.findOne.mockReturnValueOnce(orcamentoDto);
      mockGastosVariadosService.create.mockResolvedValue(createdGasto);

      const result = await controller.create(req, orcamento_id, dto);

      expect(result).toEqual(createdGasto);
      expect(service.create).toHaveBeenCalledWith(orcamentoDto.id, dto);
    });

    it("should call orcamentos service", async () => {
      const req = buildRequest();
      const orcamento_id = faker.number.int();
      const dto = buildCreateDto();
      const orcamentoDto = buildOrcamentoDto();
      const categoriaDto = buildCategoriaResponseDto();

      mockCategoriaGastosService.findOne.mockReturnValueOnce(categoriaDto);
      mockOrcamentosService.findOne.mockReturnValueOnce(orcamentoDto);

      await controller.create(req, orcamento_id, dto);

      expect(orcamentosService.findOne).toHaveBeenCalledWith(
        req.user.id,
        orcamento_id,
      );
    });

    it("should throw exception if orcamentos service returns null", async () => {
      const req = buildRequest();
      const orcamento_id = faker.number.int();
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
      const orcamento_id = faker.number.int();
      const dto = buildCreateDto();
      const orcamentoDto = buildOrcamentoDto();
      const categoriaDto = buildCategoriaResponseDto();

      mockCategoriaGastosService.findOne.mockReturnValueOnce(categoriaDto);
      mockOrcamentosService.findOne.mockReturnValueOnce(orcamentoDto);

      await controller.create(req, orcamento_id, dto);

      expect(categoriaGastosService.findOne).toHaveBeenCalledWith(
        req.user.id,
        dto.categoria_id,
      );
    });

    it("should throw exception if categoria gasto service returns null", async () => {
      const req = buildRequest();
      const orcamento_id = faker.number.int();
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
    it("should return an array of gastos variados", async () => {
      const req = buildRequest();
      const orcamento_id = faker.number.int();
      const orcamentoDto = buildOrcamentoDto();
      const filters: GastoVariadoFindDto = {};
      const gastos: GastoVariadoResponseDto[] = [
        buildGastoVariadoResponseDto(),
        buildGastoVariadoResponseDto(),
      ];

      mockOrcamentosService.findOne.mockReturnValueOnce(orcamentoDto);
      mockGastosVariadosService.findAll.mockResolvedValue(gastos);

      const result = await controller.findAll(req, orcamento_id, filters);

      expect(result).toEqual(gastos);
      expect(service.findAll).toHaveBeenCalledWith(orcamentoDto.id, filters);
    });

    it("should call orcamentos service", async () => {
      const req = buildRequest();
      const orcamento_id = faker.number.int();
      const orcamentoDto = buildOrcamentoDto();

      mockOrcamentosService.findOne.mockReturnValueOnce(orcamentoDto);

      await controller.findAll(req, orcamento_id, {});

      expect(orcamentosService.findOne).toHaveBeenCalledWith(
        req.user.id,
        orcamento_id,
      );
    });

    it("should throw exception if orcamentos service returns null", async () => {
      const req = buildRequest();
      const orcamento_id = faker.number.int();

      mockOrcamentosService.findOne.mockReturnValueOnce(null);

      await expect(controller.findAll(req, orcamento_id, {})).rejects.toThrow(
        new NotFoundException("O orçamento informado não foi encontrado."),
      );
    });
  });

  describe("findOne", () => {
    it("should return a gasto variado by id", async () => {
      const req = buildRequest();
      const orcamento_id = faker.number.int();
      const gasto_variado_id = faker.number.int();
      const orcamentoDto = buildOrcamentoDto();
      const gasto = buildGastoVariadoResponseDto({ id: gasto_variado_id });

      mockOrcamentosService.findOne.mockReturnValueOnce(orcamentoDto);
      mockGastosVariadosService.findOne.mockResolvedValue(gasto);

      const result = await controller.findOne(
        req,
        orcamento_id,
        gasto_variado_id,
      );

      expect(result).toEqual(gasto);
    });

    it("should return null if gasto variado not found", async () => {
      const req = buildRequest();
      const orcamento_id = faker.number.int();
      const orcamentoDto = buildOrcamentoDto();

      mockOrcamentosService.findOne.mockReturnValueOnce(orcamentoDto);
      mockGastosVariadosService.findOne.mockResolvedValue(null);

      const result = await controller.findOne(req, orcamento_id, 999);

      expect(result).toBeNull();
    });

    it("should call orcamentos service", async () => {
      const req = buildRequest();
      const orcamento_id = faker.number.int();
      const gasto_variado_id = faker.number.int();
      const orcamentoDto = buildOrcamentoDto();

      mockOrcamentosService.findOne.mockReturnValueOnce(orcamentoDto);
      mockGastosVariadosService.findOne.mockResolvedValue(null);

      await controller.findOne(req, orcamento_id, gasto_variado_id);

      expect(orcamentosService.findOne).toHaveBeenCalledWith(
        req.user.id,
        orcamento_id,
      );
    });

    it("should throw exception if orcamentos service returns null", async () => {
      const req = buildRequest();
      const orcamento_id = faker.number.int();
      const gasto_variado_id = faker.number.int();

      mockOrcamentosService.findOne.mockReturnValueOnce(null);

      await expect(
        controller.findOne(req, orcamento_id, gasto_variado_id),
      ).rejects.toThrow(
        new NotFoundException("O orçamento informado não foi encontrado."),
      );
    });
  });

  describe("update", () => {
    it("should update a gasto variado", async () => {
      const req = buildRequest();
      const orcamento_id = faker.number.int();
      const gasto_variado_id = faker.number.int();
      const dto = buildUpdateDto({ data_pgto: new Date() });
      const orcamentoDto = buildOrcamentoDto();
      const updatedGasto = buildGastoVariadoResponseDto({
        id: gasto_variado_id,
      });

      mockOrcamentosService.findOne.mockReturnValueOnce(orcamentoDto);
      mockGastosVariadosService.update.mockResolvedValue(updatedGasto);

      const result = await controller.update(
        req,
        orcamento_id,
        gasto_variado_id,
        dto,
      );

      expect(result).toEqual(updatedGasto);
      expect(service.update).toHaveBeenCalledWith(
        orcamentoDto.id,
        gasto_variado_id,
        dto,
      );
    });

    it("should call orcamentos service", async () => {
      const req = buildRequest();
      const orcamento_id = faker.number.int();
      const gasto_variado_id = faker.number.int();
      const dto = buildUpdateDto();
      const orcamentoDto = buildOrcamentoDto();

      mockOrcamentosService.findOne.mockReturnValueOnce(orcamentoDto);

      await controller.update(req, orcamento_id, gasto_variado_id, dto);

      expect(orcamentosService.findOne).toHaveBeenCalledWith(
        req.user.id,
        orcamento_id,
      );
    });

    it("should throw exception if orcamentos service returns null", async () => {
      const req = buildRequest();
      const orcamento_id = faker.number.int();
      const gasto_variado_id = faker.number.int();
      const dto = buildUpdateDto();

      mockOrcamentosService.findOne.mockReturnValueOnce(null);

      await expect(
        controller.update(req, orcamento_id, gasto_variado_id, dto),
      ).rejects.toThrow(
        new NotFoundException("O orçamento informado não foi encontrado."),
      );
    });
  });

  describe("remove", () => {
    it("should perform a soft delete of a gasto variado", async () => {
      const req = buildRequest();
      const orcamento_id = faker.number.int();
      const gasto_variado_id = faker.number.int();
      const orcamentoDto = buildOrcamentoDto();
      const deletedGasto = buildGastoVariadoResponseDto({
        id: gasto_variado_id,
      });

      mockOrcamentosService.findOne.mockReturnValueOnce(orcamentoDto);
      mockGastosVariadosService.softDelete.mockResolvedValue(deletedGasto);

      const result = await controller.remove(
        req,
        orcamento_id,
        gasto_variado_id,
      );

      expect(result).toEqual(deletedGasto);
      expect(service.softDelete).toHaveBeenCalledWith(
        orcamentoDto.id,
        gasto_variado_id,
      );
    });

    it("should call orcamentos service", async () => {
      const req = buildRequest();
      const orcamento_id = faker.number.int();
      const gasto_variado_id = faker.number.int();
      const orcamentoDto = buildOrcamentoDto();

      mockOrcamentosService.findOne.mockReturnValueOnce(orcamentoDto);

      await controller.remove(req, orcamento_id, gasto_variado_id);

      expect(orcamentosService.findOne).toHaveBeenCalledWith(
        req.user.id,
        orcamento_id,
      );
    });

    it("should throw exception if orcamentos service returns null", async () => {
      const req = buildRequest();
      const orcamento_id = faker.number.int();
      const gasto_variado_id = faker.number.int();

      mockOrcamentosService.findOne.mockReturnValueOnce(null);

      await expect(
        controller.remove(req, orcamento_id, gasto_variado_id),
      ).rejects.toThrow(
        new NotFoundException("O orçamento informado não foi encontrado."),
      );
    });
  });
});

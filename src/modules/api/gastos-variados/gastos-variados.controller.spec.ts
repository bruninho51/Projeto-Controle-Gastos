import { Test, TestingModule } from "@nestjs/testing";
import { GastosVariadosController } from "./gastos-variados.controller";
import { GastosVariadosService } from "./gastos-variados.service";
import { GastoVariadoCreateDto } from "./dtos/GastoVariadoCreate.dto";
import { GastoVariadoUpdateDto } from "./dtos/GastoVariadoUpdate.dto";
import { faker } from "@faker-js/faker";
import { OrcamentosService } from "../orcamentos/orcamentos.service";
import { CategoriasGastosService } from "../categorias-gastos/categorias-gastos.service";
import { NotFoundException } from "@nestjs/common";

const mockGastosVariadosService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  softDelete: jest.fn(),
};

const mockOrcamentosService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  softDelete: jest.fn(),
};

const mockCategoriaGastosService = {
  findAll: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  softDelete: jest.fn(),
};

describe("GastosVariadosController", () => {
  let controller: GastosVariadosController;
  let service: GastosVariadosService;
  let orcamentosService: OrcamentosService;
  let categoriaGastosService: CategoriasGastosService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GastosVariadosController],
      providers: [
        GastosVariadosService,
        {
          provide: GastosVariadosService,
          useValue: mockGastosVariadosService,
        },
        {
          provide: OrcamentosService,
          useValue: mockOrcamentosService,
        },
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
      const orcamento_id = faker.number.int().toString();

      const createGastoDto: GastoVariadoCreateDto = {
        descricao: faker.string.alphanumeric(5),
        observacoes: faker.string.alphanumeric(5),
        categoria_id: faker.number.int(),
        valor: faker.number
          .float({ min: 100, max: 9999, fractionDigits: 2 })
          .toString(),
        data_pgto: new Date(),
      };

      const createdGasto = {
        ...createGastoDto,
        id: 1,
        data_criacao: new Date(),
        data_atualizacao: new Date(),
      };

      const orcamentoDto = { id: faker.number.int() };
      const categoriaDto = { id: faker.number.int() };

      mockCategoriaGastosService.findOne.mockReturnValueOnce(categoriaDto);
      mockOrcamentosService.findOne.mockReturnValueOnce(orcamentoDto);
      mockGastosVariadosService.create.mockResolvedValue(createdGasto);

      const usuarioId = faker.number.int();

      const result = await controller.create({ user: { id: usuarioId } }, orcamento_id, createGastoDto);

      expect(result).toEqual(createdGasto);
      expect(service.create).toHaveBeenCalledWith(
        orcamentoDto.id,
        createGastoDto,
      );
    });

    it("should call orcamentos service", async () => {
      const orcamento_id = faker.number.int().toString();

      const createGastoDto: GastoVariadoCreateDto = {
        descricao: faker.string.alphanumeric(5),
        observacoes: faker.string.alphanumeric(5),
        categoria_id: faker.number.int(),
        valor: faker.number
          .float({ min: 100, max: 9999, fractionDigits: 2 })
          .toString(),
        data_pgto: new Date(),
      };

      const createdGasto = {
        ...createGastoDto,
        id: 1,
        data_criacao: new Date(),
        data_atualizacao: new Date(),
      };

      const orcamentoDto = { id: faker.number.int() };
      const categoriaDto = { id: faker.number.int() };

      mockCategoriaGastosService.findOne.mockReturnValueOnce(categoriaDto);
      mockOrcamentosService.findOne.mockReturnValueOnce(orcamentoDto);
      mockGastosVariadosService.create.mockResolvedValue(createdGasto);

      const usuarioId = faker.number.int();

      await controller.create({ user: { id: usuarioId } }, orcamento_id, createGastoDto);

      expect(orcamentosService.findOne).toHaveBeenCalledWith(usuarioId, +orcamento_id);
    });

    it("should throw exception if orcamentos service returns null", async () => {
      const orcamento_id = faker.number.int().toString();

      const createGastoDto: GastoVariadoCreateDto = {
        descricao: faker.string.alphanumeric(5),
        observacoes: faker.string.alphanumeric(5),
        categoria_id: faker.number.int(),
        valor: faker.number
          .float({ min: 100, max: 9999, fractionDigits: 2 })
          .toString(),
        data_pgto: new Date(),
      };

      const createdGasto = {
        ...createGastoDto,
        id: 1,
        data_criacao: new Date(),
        data_atualizacao: new Date(),
      };

      const orcamentoDto = null;
      const categoriaDto = { id: faker.number.int() };

      const usuarioId = faker.number.int();

      mockCategoriaGastosService.findOne.mockReturnValueOnce(categoriaDto);
      mockOrcamentosService.findOne.mockReturnValueOnce(orcamentoDto);
      mockGastosVariadosService.create.mockResolvedValue(createdGasto);

      const promise = controller.create({ user: { id: usuarioId } }, orcamento_id, createGastoDto);

      await expect(promise).rejects.toThrow(
        new NotFoundException("O orçamento informado não foi encontrado."),
      );
    });

    it("should call categoria gasto service", async () => {
      const orcamento_id = faker.number.int().toString();

      const createGastoDto: GastoVariadoCreateDto = {
        descricao: faker.string.alphanumeric(5),
        observacoes: faker.string.alphanumeric(5),
        categoria_id: faker.number.int(),
        valor: faker.number
          .float({ min: 100, max: 9999, fractionDigits: 2 })
          .toString(),
        data_pgto: new Date(),
      };

      const createdGasto = {
        ...createGastoDto,
        id: 1,
        data_criacao: new Date(),
        data_atualizacao: new Date(),
      };

      const orcamentoDto = { id: faker.number.int() };
      const categoriaDto = { id: faker.number.int() };

      const usuarioId = faker.number.int();

      mockCategoriaGastosService.findOne.mockReturnValueOnce(categoriaDto);
      mockOrcamentosService.findOne.mockReturnValueOnce(orcamentoDto);
      mockGastosVariadosService.create.mockResolvedValue(createdGasto);

      await controller.create({ user: { id: usuarioId } }, orcamento_id, createGastoDto);

      expect(categoriaGastosService.findOne).toHaveBeenCalledWith(
        usuarioId,
        +createGastoDto.categoria_id,
      );
    });

    it("should throw exception if categoria gasto service returns null", async () => {
      const orcamento_id = faker.number.int().toString();

      const createGastoDto: GastoVariadoCreateDto = {
        descricao: faker.string.alphanumeric(5),
        observacoes: faker.string.alphanumeric(5),
        categoria_id: faker.number.int(),
        valor: faker.number
          .float({ min: 100, max: 9999, fractionDigits: 2 })
          .toString(),
        data_pgto: new Date(),
      };

      const createdGasto = {
        ...createGastoDto,
        id: 1,
        data_criacao: new Date(),
        data_atualizacao: new Date(),
      };

      const orcamentoDto = { id: faker.number.int() };
      const categoriaDto = null;

      const usuarioId = faker.number.int();

      mockCategoriaGastosService.findOne.mockReturnValueOnce(categoriaDto);
      mockOrcamentosService.findOne.mockReturnValueOnce(orcamentoDto);
      mockGastosVariadosService.create.mockResolvedValue(createdGasto);

      const promise = controller.create({ user: { id: usuarioId } }, orcamento_id, createGastoDto);

      await expect(promise).rejects.toThrow(
        new NotFoundException("A categoria informada não foi encontrada."),
      );
    });
  });

  describe("findAll", () => {
    it("should return an array of gastos variados", async () => {
      const orcamento_id = faker.number.int().toString();

      const gastos = [
        {
          id: 1,
          descricao: "Aluguel",
          valor: "1200.00",
          data_pgto: new Date(),
        },
        {
          id: 2,
          descricao: "Internet",
          valor: "150.00",
          data_pgto: new Date(),
        },
      ];

      const orcamentoDto = { id: faker.number.int() };

      mockOrcamentosService.findOne.mockReturnValueOnce(orcamentoDto);
      mockGastosVariadosService.findAll.mockResolvedValue(gastos);

      const usuarioId = faker.number.int();

      const result = await controller.findAll({ user: { id: usuarioId } }, orcamento_id);

      expect(result).toEqual(gastos);
      expect(service.findAll).toHaveBeenCalledWith(orcamentoDto.id);
    });

    it("should call orcamentos service", async () => {
      const orcamento_id = faker.number.int().toString();

      const gastos = [
        {
          id: 1,
          descricao: "Aluguel",
          valor: "1200.00",
          data_pgto: new Date(),
        },
        {
          id: 2,
          descricao: "Internet",
          valor: "150.00",
          data_pgto: new Date(),
        },
      ];

      const orcamentoDto = { id: faker.number.int() };

      mockOrcamentosService.findOne.mockReturnValueOnce(orcamentoDto);
      mockGastosVariadosService.findAll.mockResolvedValue(gastos);

      const usuarioId = faker.number.int();

      await controller.findAll({ user: { id: usuarioId } }, orcamento_id);

      expect(orcamentosService.findOne).toHaveBeenCalledWith(usuarioId, +orcamento_id);
    });

    it("should throw exception if orcamentos service returns null", async () => {
      const orcamento_id = faker.number.int().toString();

      const gastos = [
        {
          id: 1,
          descricao: "Aluguel",
          previsto: "1200.00",
          data_pgto: new Date(),
        },
        {
          id: 2,
          descricao: "Internet",
          previsto: "150.00",
          data_pgto: new Date(),
        },
      ];

      const orcamentoDto = null;

      mockOrcamentosService.findOne.mockReturnValueOnce(orcamentoDto);
      mockGastosVariadosService.findAll.mockResolvedValue(gastos);

      const usuarioId = faker.number.int();

      const promise = controller.findAll({ user: { id: usuarioId } }, orcamento_id);

      await expect(promise).rejects.toThrow(
        new NotFoundException("O orçamento informado não foi encontrado."),
      );
    });
  });

  describe("findOne", () => {
    it("should return a gasto variado by id", async () => {
      const orcamento_id = faker.number.int().toString();
      const gasto_variado_id = faker.number.int().toString();

      const gasto = {
        id: gasto_variado_id,
        descricao: "Aluguel",
        valor: "1200.00",
        data_pgto: new Date(),
      };

      const orcamentoDto = { id: faker.number.int() };

      mockOrcamentosService.findOne.mockReturnValueOnce(orcamentoDto);
      mockGastosVariadosService.findOne.mockResolvedValue(gasto);

      const usuarioId = faker.number.int();

      const result = await controller.findOne({ user: { id: usuarioId } }, orcamento_id, gasto_variado_id);

      expect(result).toEqual(gasto);
    });

    it("should return null if gasto variado not found", async () => {
      const orcamento_id = faker.number.int().toString();
      const gasto_variado_id = "999";

      const orcamentoDto = { id: faker.number.int() };

      mockOrcamentosService.findOne.mockReturnValueOnce(orcamentoDto);
      mockGastosVariadosService.findOne.mockResolvedValue(null);

      const usuarioId = faker.number.int();

      const result = await controller.findOne({ user: { id: usuarioId } }, orcamento_id, gasto_variado_id);

      expect(result).toBeNull();
    });

    it("should call orcamentos service", async () => {
      const orcamento_id = faker.number.int().toString();
      const gasto_fixo_id = faker.number.int().toString();

      const gasto = {
        id: gasto_fixo_id,
        descricao: "Aluguel",
        valor: "1200.00",
        data_pgto: new Date(),
      };

      const orcamentoDto = { id: faker.number.int() };

      mockOrcamentosService.findOne.mockReturnValueOnce(orcamentoDto);
      mockGastosVariadosService.findOne.mockResolvedValue(gasto);

      const usuarioId = faker.number.int();

      await controller.findOne({ user: { id: usuarioId } }, orcamento_id, gasto_fixo_id);

      expect(orcamentosService.findOne).toHaveBeenCalledWith(usuarioId, +orcamento_id);
    });

    it("should throw exception if orcamentos service returns null", async () => {
      const orcamento_id = faker.number.int().toString();
      const gasto_fixo_id = faker.number.int().toString();

      const gasto = {
        id: gasto_fixo_id,
        descricao: "Aluguel",
        valor: "1200.00",
        data_pgto: new Date(),
      };

      const orcamentoDto = null;

      mockOrcamentosService.findOne.mockReturnValueOnce(orcamentoDto);
      mockGastosVariadosService.findOne.mockResolvedValue(gasto);

      const usuarioId = faker.number.int();

      const promise = controller.findOne({ user: { id: usuarioId } }, orcamento_id, gasto_fixo_id);

      await expect(promise).rejects.toThrow(
        new NotFoundException("O orçamento informado não foi encontrado."),
      );
    });
  });

  describe("update", () => {
    it("should update a gasto variado", async () => {
      const orcamento_id = faker.number.int().toString();
      const gasto_variado_id = faker.number.int().toString();

      const updateGastoDto: GastoVariadoUpdateDto = {
        descricao: "Aluguel Atualizado",
        valor: "1300.00",
        data_pgto: new Date(),
      };

      const updatedGasto = {
        ...updateGastoDto,
        id: 1,
        data_atualizacao: new Date(),
      };

      const orcamentoDto = { id: faker.number.int() };

      const usuarioId = faker.number.int();

      mockOrcamentosService.findOne.mockReturnValueOnce(orcamentoDto);
      mockGastosVariadosService.update.mockResolvedValue(updatedGasto);

      const result = await controller.update(
        { user: { id: usuarioId } },
        orcamento_id,
        gasto_variado_id,
        updateGastoDto,
      );

      expect(result).toEqual(updatedGasto);
      expect(service.update).toHaveBeenCalledWith(
        orcamentoDto.id,
        +gasto_variado_id,
        updateGastoDto,
      );
    });

    it("should call orcamentos service", async () => {
      const orcamento_id = faker.number.int().toString();
      const gasto_fixo_id = faker.number.int().toString();

      const updateGastoDto: GastoVariadoUpdateDto = {
        descricao: "Aluguel Atualizado",
        valor: "1300.00",
      };

      const updatedGasto = {
        ...updateGastoDto,
        id: 1,
        data_atualizacao: new Date(),
      };

      const orcamentoDto = { id: faker.number.int() };

      const usuarioId = faker.number.int();

      mockOrcamentosService.findOne.mockReturnValueOnce(orcamentoDto);
      mockGastosVariadosService.update.mockResolvedValue(updatedGasto);

      await controller.update({ user: { id: usuarioId } }, orcamento_id, gasto_fixo_id, updateGastoDto);

      expect(orcamentosService.findOne).toHaveBeenCalledWith(usuarioId, +orcamento_id);
    });

    it("should throw exception if orcamentos service returns null", async () => {
      const orcamento_id = faker.number.int().toString();
      const gasto_fixo_id = faker.number.int().toString();

      const updateGastoDto: GastoVariadoUpdateDto = {
        descricao: "Aluguel Atualizado",
        valor: "1300.00",
      };

      const updatedGasto = {
        ...updateGastoDto,
        id: 1,
        data_atualizacao: new Date(),
      };

      const orcamentoDto = null;

      const usuarioId = faker.number.int();

      mockOrcamentosService.findOne.mockReturnValueOnce(orcamentoDto);
      mockGastosVariadosService.update.mockResolvedValue(updatedGasto);

      const promise = controller.update(
        { user: { id: usuarioId } }, 
        orcamento_id,
        gasto_fixo_id,
        updateGastoDto,
      );

      await expect(promise).rejects.toThrow(
        new NotFoundException("O orçamento informado não foi encontrado."),
      );
    });
  });

  describe("remove", () => {
    it("should perform a soft delete of a gasto variado", async () => {
      const orcamento_id = faker.number.int().toString();
      const gasto_variado_id = faker.number.int().toString();

      const gastoToDelete = {
        id: gasto_variado_id,
        descricao: "Aluguel",
        valor: "1200.00",
        data_pgto: new Date(),
      };

      const orcamentoDto = { id: faker.number.int() };

      mockOrcamentosService.findOne.mockReturnValueOnce(orcamentoDto);
      mockGastosVariadosService.softDelete.mockResolvedValue(gastoToDelete);

      const usuarioId = faker.number.int();

      const result = await controller.remove({ user: { id: usuarioId } }, orcamento_id, gasto_variado_id);

      expect(result).toEqual(gastoToDelete);
      expect(service.softDelete).toHaveBeenCalledWith(
        orcamentoDto.id,
        +gasto_variado_id,
      );
    });

    it("should call orcamentos service", async () => {
      const orcamento_id = faker.number.int().toString();
      const gasto_fixo_id = faker.number.int().toString();

      const gastoToDelete = {
        id: gasto_fixo_id,
        descricao: "Aluguel",
        valor: "1200.00",
        data_pgto: new Date(),
      };

      const orcamentoDto = { id: faker.number.int() };

      mockOrcamentosService.findOne.mockReturnValueOnce(orcamentoDto);
      mockGastosVariadosService.softDelete.mockResolvedValue(gastoToDelete);

      const usuarioId = faker.number.int();

      await controller.remove({ user: { id: usuarioId } }, orcamento_id, gasto_fixo_id);

      expect(orcamentosService.findOne).toHaveBeenCalledWith(usuarioId, +orcamento_id);
    });

    it("should throw exception if orcamentos service returns null", async () => {
      const orcamento_id = faker.number.int().toString();
      const gasto_fixo_id = faker.number.int().toString();

      const gastoToDelete = {
        id: gasto_fixo_id,
        descricao: "Aluguel",
        valor: "1200.00",
        data_pgto: new Date(),
      };

      const orcamentoDto = null;

      mockOrcamentosService.findOne.mockReturnValueOnce(orcamentoDto);
      mockGastosVariadosService.softDelete.mockResolvedValue(gastoToDelete);

      const usuarioId = faker.number.int();

      const promise = controller.remove({ user: { id: usuarioId } }, orcamento_id, gasto_fixo_id);

      await expect(promise).rejects.toThrow(
        new NotFoundException("O orçamento informado não foi encontrado."),
      );
    });
  });
});

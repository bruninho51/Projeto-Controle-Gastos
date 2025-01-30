import { Test, TestingModule } from "@nestjs/testing";
import { GastosFixosController } from "./gastos-fixos.controller";
import { GastosFixosService } from "./gastos-fixos.service";
import { GastoFixoCreateDto } from "./dtos/GastoFixoCreate.dto";
import { GastoFixoUpdateDto } from "./dtos/GastoFixoUpdate.dto";
import { faker } from "@faker-js/faker";
import { OrcamentosService } from "../orcamentos/orcamentos.service";
import { NotFoundException } from "@nestjs/common";
import { CategoriasGastosService } from "../categorias-gastos/categorias-gastos.service";
import { CategoriaGasto } from "@prisma/client";

const mockGastosFixosService = {
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

describe("GastosFixosController", () => {
  let controller: GastosFixosController;
  let service: GastosFixosService;
  let orcamentosService: OrcamentosService;
  let categoriaGastosService: CategoriasGastosService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GastosFixosController],
      providers: [
        GastosFixosService,
        {
          provide: GastosFixosService,
          useValue: mockGastosFixosService,
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
      const orcamento_id = faker.number.int().toString();

      const createGastoDto: GastoFixoCreateDto = {
        descricao: faker.string.alphanumeric(5),
        observacoes: faker.string.alphanumeric(5),
        categoria_id: faker.number.int(),
        previsto: faker.number
          .float({ min: 100, max: 9999, fractionDigits: 2 })
          .toString(),
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
      mockGastosFixosService.create.mockResolvedValue(createdGasto);

      const result = await controller.create(orcamento_id, createGastoDto);

      expect(result).toEqual(createdGasto);
      expect(service.create).toHaveBeenCalledWith(
        orcamentoDto.id,
        createGastoDto,
      );
    });

    it("should call orcamentos service", async () => {
      const orcamento_id = faker.number.int().toString();

      const createGastoDto: GastoFixoCreateDto = {
        descricao: faker.string.alphanumeric(5),
        observacoes: faker.string.alphanumeric(5),
        categoria_id: faker.number.int(),
        previsto: faker.number
          .float({ min: 100, max: 9999, fractionDigits: 2 })
          .toString(),
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
      mockGastosFixosService.create.mockResolvedValue(createdGasto);

      await controller.create(orcamento_id, createGastoDto);

      expect(orcamentosService.findOne).toHaveBeenCalledWith(+orcamento_id);
    });

    it("should throw exception if orcamentos service returns null", async () => {
      const orcamento_id = faker.number.int().toString();

      const createGastoDto: GastoFixoCreateDto = {
        descricao: faker.string.alphanumeric(5),
        observacoes: faker.string.alphanumeric(5),
        categoria_id: faker.number.int(),
        previsto: faker.number
          .float({ min: 100, max: 9999, fractionDigits: 2 })
          .toString(),
      };

      const createdGasto = {
        ...createGastoDto,
        id: 1,
        data_criacao: new Date(),
        data_atualizacao: new Date(),
      };

      const orcamentoDto = null;
      const categoriaDto = { id: faker.number.int() };

      mockCategoriaGastosService.findOne.mockReturnValueOnce(categoriaDto);
      mockOrcamentosService.findOne.mockReturnValueOnce(orcamentoDto);
      mockGastosFixosService.create.mockResolvedValue(createdGasto);

      const promise = controller.create(orcamento_id, createGastoDto);

      await expect(promise).rejects.toThrow(
        new NotFoundException("O orçamento informado não foi encontrado."),
      );
    });

    it("should call categoria gasto service", async () => {
      const orcamento_id = faker.number.int().toString();

      const createGastoDto: GastoFixoCreateDto = {
        descricao: faker.string.alphanumeric(5),
        observacoes: faker.string.alphanumeric(5),
        categoria_id: faker.number.int(),
        previsto: faker.number
          .float({ min: 100, max: 9999, fractionDigits: 2 })
          .toString(),
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
      mockGastosFixosService.create.mockResolvedValue(createdGasto);

      await controller.create(orcamento_id, createGastoDto);

      expect(categoriaGastosService.findOne).toHaveBeenCalledWith(
        +createGastoDto.categoria_id,
      );
    });

    it("should throw exception if categoria gasto service returns null", async () => {
      const orcamento_id = faker.number.int().toString();

      const createGastoDto: GastoFixoCreateDto = {
        descricao: faker.string.alphanumeric(5),
        observacoes: faker.string.alphanumeric(5),
        categoria_id: faker.number.int(),
        previsto: faker.number
          .float({ min: 100, max: 9999, fractionDigits: 2 })
          .toString(),
      };

      const createdGasto = {
        ...createGastoDto,
        id: 1,
        data_criacao: new Date(),
        data_atualizacao: new Date(),
      };

      const orcamentoDto = { id: faker.number.int() };
      const categoriaDto = null;

      mockCategoriaGastosService.findOne.mockReturnValueOnce(categoriaDto);
      mockOrcamentosService.findOne.mockReturnValueOnce(orcamentoDto);
      mockGastosFixosService.create.mockResolvedValue(createdGasto);

      const promise = controller.create(orcamento_id, createGastoDto);

      await expect(promise).rejects.toThrow(
        new NotFoundException("A categoria informada não foi encontrada."),
      );
    });
  });

  describe("findAll", () => {
    it("should return an array of gastos fixos", async () => {
      const orcamento_id = faker.number.int().toString();

      const gastos = [
        { id: 1, descricao: "Aluguel", previsto: "1200.00" },
        { id: 2, descricao: "Internet", previsto: "150.00" },
      ];

      const orcamentoDto = { id: faker.number.int() };

      mockOrcamentosService.findOne.mockReturnValueOnce(orcamentoDto);
      mockGastosFixosService.findAll.mockResolvedValue(gastos);

      const result = await controller.findAll(orcamento_id);

      expect(result).toEqual(gastos);
      expect(service.findAll).toHaveBeenCalledWith(orcamentoDto.id);
    });

    it("should call orcamentos service", async () => {
      const orcamento_id = faker.number.int().toString();

      const gastos = [
        { id: 1, descricao: "Aluguel", previsto: "1200.00" },
        { id: 2, descricao: "Internet", previsto: "150.00" },
      ];

      const orcamentoDto = { id: faker.number.int() };

      mockOrcamentosService.findOne.mockReturnValueOnce(orcamentoDto);
      mockGastosFixosService.findAll.mockResolvedValue(gastos);

      await controller.findAll(orcamento_id);

      expect(orcamentosService.findOne).toHaveBeenCalledWith(+orcamento_id);
    });

    it("should throw exception if orcamentos service returns null", async () => {
      const orcamento_id = faker.number.int().toString();

      const gastos = [
        { id: 1, descricao: "Aluguel", previsto: "1200.00" },
        { id: 2, descricao: "Internet", previsto: "150.00" },
      ];

      const orcamentoDto = null;

      mockOrcamentosService.findOne.mockReturnValueOnce(orcamentoDto);
      mockGastosFixosService.findAll.mockResolvedValue(gastos);

      const promise = controller.findAll(orcamento_id);

      await expect(promise).rejects.toThrow(
        new NotFoundException("O orçamento informado não foi encontrado."),
      );
    });
  });

  describe("findOne", () => {
    it("should return a gasto fixo by id", async () => {
      const orcamento_id = faker.number.int().toString();
      const gasto_fixo_id = faker.number.int().toString();

      const gasto = {
        id: gasto_fixo_id,
        descricao: "Aluguel",
        previsto: "1200.00",
      };

      const orcamentoDto = { id: faker.number.int() };

      mockOrcamentosService.findOne.mockReturnValueOnce(orcamentoDto);
      mockGastosFixosService.findOne.mockResolvedValue(gasto);

      const result = await controller.findOne(orcamento_id, gasto_fixo_id);

      expect(result).toEqual(gasto);
    });

    it("should return null if gasto fixo not found", async () => {
      const orcamento_id = faker.number.int().toString();
      const gasto_fixo_id = "999";

      const orcamentoDto = { id: faker.number.int() };

      mockOrcamentosService.findOne.mockReturnValueOnce(orcamentoDto);
      mockGastosFixosService.findOne.mockResolvedValue(null);

      const result = await controller.findOne(orcamento_id, gasto_fixo_id);

      expect(result).toBeNull();
    });

    it("should call orcamentos service", async () => {
      const orcamento_id = faker.number.int().toString();
      const gasto_fixo_id = faker.number.int().toString();

      const gasto = {
        id: gasto_fixo_id,
        descricao: "Aluguel",
        previsto: "1200.00",
      };

      const orcamentoDto = { id: faker.number.int() };

      mockOrcamentosService.findOne.mockReturnValueOnce(orcamentoDto);
      mockGastosFixosService.findOne.mockResolvedValue(gasto);

      await controller.findOne(orcamento_id, gasto_fixo_id);

      expect(orcamentosService.findOne).toHaveBeenCalledWith(+orcamento_id);
    });

    it("should throw exception if orcamentos service returns null", async () => {
      const orcamento_id = faker.number.int().toString();
      const gasto_fixo_id = faker.number.int().toString();

      const gasto = {
        id: gasto_fixo_id,
        descricao: "Aluguel",
        previsto: "1200.00",
      };

      const orcamentoDto = null;

      mockOrcamentosService.findOne.mockReturnValueOnce(orcamentoDto);
      mockGastosFixosService.findOne.mockResolvedValue(gasto);

      const promise = controller.findOne(orcamento_id, gasto_fixo_id);

      await expect(promise).rejects.toThrow(
        new NotFoundException("O orçamento informado não foi encontrado."),
      );
    });
  });

  describe("update", () => {
    it("should update a gasto fixo", async () => {
      const orcamento_id = faker.number.int().toString();
      const gasto_fixo_id = faker.number.int().toString();

      const updateGastoDto: GastoFixoUpdateDto = {
        descricao: "Aluguel Atualizado",
        previsto: "1300.00",
      };

      const updatedGasto = {
        ...updateGastoDto,
        id: 1,
        data_atualizacao: new Date(),
      };

      const orcamentoDto = { id: faker.number.int() };

      mockOrcamentosService.findOne.mockReturnValueOnce(orcamentoDto);
      mockGastosFixosService.update.mockResolvedValue(updatedGasto);

      const result = await controller.update(
        orcamento_id,
        gasto_fixo_id,
        updateGastoDto,
      );

      expect(result).toEqual(updatedGasto);
      expect(service.update).toHaveBeenCalledWith(
        orcamentoDto.id,
        +gasto_fixo_id,
        updateGastoDto,
      );
    });

    it("should call orcamentos service", async () => {
      const orcamento_id = faker.number.int().toString();
      const gasto_fixo_id = faker.number.int().toString();

      const updateGastoDto: GastoFixoUpdateDto = {
        descricao: "Aluguel Atualizado",
        previsto: "1300.00",
      };

      const updatedGasto = {
        ...updateGastoDto,
        id: 1,
        data_atualizacao: new Date(),
      };

      const orcamentoDto = { id: faker.number.int() };

      mockOrcamentosService.findOne.mockReturnValueOnce(orcamentoDto);
      mockGastosFixosService.update.mockResolvedValue(updatedGasto);

      await controller.update(orcamento_id, gasto_fixo_id, updateGastoDto);

      expect(orcamentosService.findOne).toHaveBeenCalledWith(+orcamento_id);
    });

    it("should throw exception if orcamentos service returns null", async () => {
      const orcamento_id = faker.number.int().toString();
      const gasto_fixo_id = faker.number.int().toString();

      const updateGastoDto: GastoFixoUpdateDto = {
        descricao: "Aluguel Atualizado",
        previsto: "1300.00",
      };

      const updatedGasto = {
        ...updateGastoDto,
        id: 1,
        data_atualizacao: new Date(),
      };

      const orcamentoDto = null;

      mockOrcamentosService.findOne.mockReturnValueOnce(orcamentoDto);
      mockGastosFixosService.update.mockResolvedValue(updatedGasto);

      const promise = controller.update(
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
    it("should perform a soft delete of a gasto fixo", async () => {
      const orcamento_id = faker.number.int().toString();
      const gasto_fixo_id = faker.number.int().toString();

      const gastoToDelete = {
        id: gasto_fixo_id,
        descricao: "Aluguel",
        previsto: "1200.00",
      };

      const orcamentoDto = { id: faker.number.int() };

      mockOrcamentosService.findOne.mockReturnValueOnce(orcamentoDto);
      mockGastosFixosService.softDelete.mockResolvedValue(gastoToDelete);

      const result = await controller.remove(orcamento_id, gasto_fixo_id);

      expect(result).toEqual(gastoToDelete);
      expect(service.softDelete).toHaveBeenCalledWith(
        orcamentoDto.id,
        +gasto_fixo_id,
      );
    });

    it("should call orcamentos service", async () => {
      const orcamento_id = faker.number.int().toString();
      const gasto_fixo_id = faker.number.int().toString();

      const gastoToDelete = {
        id: gasto_fixo_id,
        descricao: "Aluguel",
        previsto: "1200.00",
      };

      const orcamentoDto = { id: faker.number.int() };

      mockOrcamentosService.findOne.mockReturnValueOnce(orcamentoDto);
      mockGastosFixosService.softDelete.mockResolvedValue(gastoToDelete);

      await controller.remove(orcamento_id, gasto_fixo_id);

      expect(orcamentosService.findOne).toHaveBeenCalledWith(+orcamento_id);
    });

    it("should throw exception if orcamentos service returns null", async () => {
      const orcamento_id = faker.number.int().toString();
      const gasto_fixo_id = faker.number.int().toString();

      const gastoToDelete = {
        id: gasto_fixo_id,
        descricao: "Aluguel",
        previsto: "1200.00",
      };

      const orcamentoDto = null;

      mockOrcamentosService.findOne.mockReturnValueOnce(orcamentoDto);
      mockGastosFixosService.softDelete.mockResolvedValue(gastoToDelete);

      const promise = controller.remove(orcamento_id, gasto_fixo_id);

      await expect(promise).rejects.toThrow(
        new NotFoundException("O orçamento informado não foi encontrado."),
      );
    });
  });
});

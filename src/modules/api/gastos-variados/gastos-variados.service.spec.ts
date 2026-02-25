import { Test, TestingModule } from "@nestjs/testing";
import { GastosVariadosService } from "./gastos-variados.service";
import { PrismaService } from "../../prisma/prisma.service";
import { GastoVariadoCreateDto } from "./dtos/GastoVariadoCreate.dto";
import { GastoVariadoUpdateDto } from "./dtos/GastoVariadoUpdate.dto";
import { faker } from "@faker-js/faker";
import { GastoVariadoFindDto } from "./dtos/GastoVariadoFind.dto";

const mockPrismaService = {
  gastoVariado: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
};

describe("GastosVariadosService", () => {
  let service: GastosVariadosService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GastosVariadosService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<GastosVariadosService>(GastosVariadosService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("create", () => {
    it("should create a new gasto variado", async () => {
      const orcamento_id = faker.number.int();
      const gasto_variado_id = faker.number.int();

      const createGastoDto: GastoVariadoCreateDto = {
        descricao: faker.string.alphanumeric(5),
        observacoes: faker.string.alphanumeric(5),
        categoria_id: faker.number.int(),
        valor: faker.number
          .float({ min: 100, max: 9999, fractionDigits: 2 })
          .toString(),
        data_pgto: new Date(),
      };

      const createdGastoVariado = {
        id: gasto_variado_id,
        ...createGastoDto,
        orcamento_id,
        data_criacao: new Date(),
        data_atualizacao: new Date(),
      };

      mockPrismaService.gastoVariado.create.mockResolvedValue(
        createdGastoVariado,
      );

      const result = await service.create(orcamento_id, createGastoDto);

      expect(result).toEqual(createdGastoVariado);
      expect(mockPrismaService.gastoVariado.create).toHaveBeenCalledWith({
        include: {
          categoriaGasto: true,
        },
        data: { ...createGastoDto, orcamento_id },
      });
    });
  });

  describe("findAll", () => {
    function getWhere() {
      const calls = mockPrismaService.gastoVariado.findMany.mock.calls;
      if (!calls.length) throw new Error("findMany não foi chamado");
      const lastCall = calls[calls.length - 1];
      return lastCall[0].where;
    }

    const BASE_WHERE = Object.freeze({
      orcamento_id: 1,
      soft_delete: null,
    });

    it("should return an array of gasto variado", async () => {
      const orcamento_id = faker.number.int();

      const filters: GastoVariadoFindDto = {};

      const gastosVariados = [
        {
          id: 1,
          descricao: "Gasto Variado A",
          valor: "1000.00",
          data_pgto: new Date(),
          observacoes: "Descrição A",
        },
        {
          id: 2,
          descricao: "Gasto Variado B",
          valor: "500.00",
          data_pgto: new Date(),
          observacoes: "Descrição B",
        },
      ];

      mockPrismaService.gastoVariado.findMany.mockResolvedValue(gastosVariados);

      const result = await service.findAll(orcamento_id, filters);

      expect(result).toEqual(gastosVariados);
      expect(mockPrismaService.gastoVariado.findMany).toHaveBeenCalledWith({
        include: {
          categoriaGasto: true,
        },
        where: { orcamento_id, soft_delete: null },
      });
    });

    it("should filter by descricao", async () => {
      const searchedValue = faker.string.alpha();

      await service.findAll(1, { descricao: searchedValue });

      expect(getWhere()).toStrictEqual({
        ...BASE_WHERE,
        descricao: { contains: searchedValue },
      });
    });

    it("should filter by data_pgto day", async () => {
      const date = new Date("2026-02-10");

      await service.findAll(1, { data_pgto: date });

      expect(getWhere()).toStrictEqual({
        ...BASE_WHERE,
        data_pgto: { equals: date },
      });
    });

    it("should filter by data_pgto range", async () => {
      const inicio = new Date("2026-02-01");
      const fim = new Date("2026-02-10");

      await service.findAll(1, {
        data_pgto_inicio: inicio,
        data_pgto_fim: fim,
      });

      expect(getWhere()).toStrictEqual({
        ...BASE_WHERE,
        data_pgto: {
          gte: inicio,
          lte: fim,
        },
      });
    });

    it("should filter by nome_categoria", async () => {
      const nome = faker.string.alpha(10);

      await service.findAll(1, { nome_categoria: nome });

      expect(getWhere()).toStrictEqual({
        ...BASE_WHERE,
        categoriaGasto: {
          nome: { contains: nome },
        },
      });
    });

    it("should apply all filters together", async () => {
      const descricao = faker.string.alpha(10);
      const categoria = faker.string.alpha(10);
      const inicio = new Date("2026-02-01");
      const fim = new Date("2026-02-10");

      await service.findAll(1, {
        descricao,
        data_pgto_inicio: inicio,
        data_pgto_fim: fim,
        nome_categoria: categoria,
      });

      expect(getWhere()).toStrictEqual({
        ...BASE_WHERE,
        descricao: { contains: descricao },
        categoriaGasto: { nome: { contains: categoria } },
        data_pgto: {
          gte: inicio,
          lte: fim,
        },
      });
    });

    it("should not add extra operators when no filters", async () => {
      await service.findAll(1, {});

      expect(getWhere()).toStrictEqual(BASE_WHERE);
    });
  });

  describe("findOne", () => {
    it("should return a single gasto variado by id", async () => {
      const orcamento_id = faker.number.int();
      const gasto_variado_id = faker.number.int();

      const gastoVariado = {
        id: gasto_variado_id,
        descricao: "Gasto Variado A",
        valor: 1000.0,
        data_pgto: new Date(),
        observacoes: "Descrição A",
        data_criacao: new Date(),
        data_atualizacao: new Date(),
      };

      mockPrismaService.gastoVariado.findUnique.mockResolvedValue(gastoVariado);

      const result = await service.findOne(orcamento_id, gasto_variado_id);

      expect(result).toEqual(gastoVariado);
      expect(mockPrismaService.gastoVariado.findUnique).toHaveBeenCalledWith({
        include: {
          categoriaGasto: true,
        },
        where: { id: gasto_variado_id, orcamento_id, soft_delete: null },
      });
    });

    it("should return null if gasto variado not found", async () => {
      const orcamento_id = faker.number.int();
      const gasto_variado_id = 999;

      mockPrismaService.gastoVariado.findUnique.mockResolvedValue(null);

      const result = await service.findOne(orcamento_id, gasto_variado_id);

      expect(result).toBeNull();
      expect(mockPrismaService.gastoVariado.findUnique).toHaveBeenCalledWith({
        include: {
          categoriaGasto: true,
        },
        where: { id: 999, orcamento_id, soft_delete: null },
      });
    });
  });

  describe("update", () => {
    it("should update a gasto variado", async () => {
      const orcamento_id = faker.number.int();
      const gasto_variado_id = faker.number.int();

      const updateGastoDto: GastoVariadoUpdateDto = {
        descricao: "Gasto Variado A Atualizado",
        valor: "1500.00",
        data_pgto: new Date(),
        observacoes: "Descrição do Gasto Variado A Atualizado",
      };

      const updatedGastoVariado = {
        id: gasto_variado_id,
        ...updateGastoDto,
        data_criacao: new Date(),
        data_atualizacao: new Date(),
      };

      mockPrismaService.gastoVariado.update.mockResolvedValue(
        updatedGastoVariado,
      );

      const result = await service.update(
        orcamento_id,
        gasto_variado_id,
        updateGastoDto,
      );

      expect(result).toEqual(updatedGastoVariado);
      expect(mockPrismaService.gastoVariado.update).toHaveBeenCalledWith({
        include: {
          categoriaGasto: true,
        },
        where: { id: gasto_variado_id, orcamento_id, soft_delete: null },
        data: updateGastoDto,
      });
    });
  });

  describe("softDelete", () => {
    it("should perform a soft delete of a gasto variado", async () => {
      const orcamento_id = faker.number.int();
      const gasto_variado_id = faker.number.int();

      const gastoVariadoToDelete = {
        id: gasto_variado_id,
        descricao: "Gasto Variado A",
        valor: "1000.00",
        data_pgto: new Date(),
        observacoes: "Descrição A",
      };

      const softDeletedGastoVariado = {
        ...gastoVariadoToDelete,
        soft_delete: new Date(),
      };

      mockPrismaService.gastoVariado.update.mockResolvedValue(
        softDeletedGastoVariado,
      );

      const result = await service.softDelete(orcamento_id, gasto_variado_id);

      expect(result).toEqual(softDeletedGastoVariado);
      expect(mockPrismaService.gastoVariado.update).toHaveBeenCalledWith({
        include: {
          categoriaGasto: true,
        },
        where: { id: gasto_variado_id, orcamento_id, soft_delete: null },
        data: { soft_delete: expect.any(Date) },
      });
    });
  });
});

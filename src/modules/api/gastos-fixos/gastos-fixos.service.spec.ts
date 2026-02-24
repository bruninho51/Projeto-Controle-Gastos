import { Test, TestingModule } from "@nestjs/testing";
import { GastosFixosService } from "./gastos-fixos.service";
import { PrismaService } from "../../prisma/prisma.service";
import { GastoFixoCreateDto } from "./dtos/GastoFixoCreate.dto";
import { GastoFixoUpdateDto } from "./dtos/GastoFixoUpdate.dto";
import { faker } from "@faker-js/faker";
import { GastoFixoFindDto, StatusGasto } from "./dtos/GastoFixoFind.dto";

let mockPrismaService: {
  gastoFixo: {
    create: jest.Mock;
    findMany: jest.Mock;
    findUnique: jest.Mock;
    update: jest.Mock;
  };
};

describe("GastosFixosService", () => {
  let service: GastosFixosService;

  beforeEach(async () => {
    jest.clearAllMocks();

    mockPrismaService = {
      gastoFixo: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GastosFixosService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<GastosFixosService>(GastosFixosService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("create", () => {
    it("should create a new gasto fixo", async () => {
      const orcamento_id = faker.number.int();
      const gasto_fixo_id = faker.number.int();

      const createGastoDto: GastoFixoCreateDto = {
        descricao: faker.string.alphanumeric(5),
        observacoes: faker.string.alphanumeric(5),
        categoria_id: faker.number.int(),
        data_venc: faker.date.future(),
        previsto: faker.number
          .float({ min: 100, max: 9999, fractionDigits: 2 })
          .toString(),
      };

      const createdGastoFixo = {
        id: gasto_fixo_id,
        ...createGastoDto,
        orcamento_id,
        data_criacao: new Date(),
        data_atualizacao: new Date(),
      };

      mockPrismaService.gastoFixo.create.mockResolvedValue(createdGastoFixo);

      const result = await service.create(orcamento_id, createGastoDto);

      expect(result).toEqual(createdGastoFixo);
      expect(mockPrismaService.gastoFixo.create).toHaveBeenCalledWith({
        include: {
          categoriaGasto: true,
        },
        data: { ...createGastoDto, orcamento_id },
      });
    });
  });

  describe("findAll", () => {
    function getWhere() {
      const calls = mockPrismaService.gastoFixo.findMany.mock.calls;
      if (!calls.length) throw new Error("findMany não foi chamado");
      const lastCall = calls[calls.length - 1];
      return lastCall[0].where;
    }

    const BASE_WHERE = Object.freeze({
      orcamento_id: 1,
      soft_delete: null,
    });

    it("should return an array of gasto fixo", async () => {
      const orcamento_id = faker.number.int();

      const filters: GastoFixoFindDto = {};

      const gastosFixos = [
        {
          id: 1,
          descricao: "Gasto Fixo A",
          previsto: "1000.00",
          observacoes: "Descrição A",
          data_venc: faker.date.future(),
        },
        {
          id: 2,
          descricao: "Gasto Fixo B",
          previsto: "500.00",
          observacoes: "Descrição B",
          data_venc: faker.date.future(),
        },
      ];

      mockPrismaService.gastoFixo.findMany.mockResolvedValue(gastosFixos);

      const result = await service.findAll(orcamento_id, filters);

      expect(result).toEqual(gastosFixos);
      expect(mockPrismaService.gastoFixo.findMany).toHaveBeenCalledWith({
        include: {
          categoriaGasto: true,
        },
        where: {
          orcamento_id,
          soft_delete: null,
        },
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

    it("should filter by status PAGO", async () => {
      await service.findAll(1, { status: StatusGasto.PAGO });

      expect(getWhere()).toStrictEqual({
        ...BASE_WHERE,
        data_pgto: { not: null },
      });
    });

    it("should filter by status NAO_PAGO", async () => {
      await service.findAll(1, { status: StatusGasto.NAO_PAGO });

      expect(getWhere()).toStrictEqual({
        ...BASE_WHERE,
        data_pgto: { equals: null },
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

    it("should filter vencido true", async () => {
      await service.findAll(1, { vencido: true });

      expect(getWhere()).toStrictEqual({
        ...BASE_WHERE,
        AND: [{ data_pgto: null }, { data_venc: { lt: expect.any(Date) } }],
      });
    });

    it("should filter vencido false", async () => {
      await service.findAll(1, { vencido: false });

      expect(getWhere()).toStrictEqual({
        ...BASE_WHERE,
        NOT: {
          AND: [{ data_pgto: null }, { data_venc: { lt: expect.any(Date) } }],
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

    it("should apply all filters together PAGO and NAO VENCIDO", async () => {
      const descricao = faker.string.alpha(10);
      const categoria = faker.string.alpha(10);
      const inicio = new Date("2026-02-01");
      const fim = new Date("2026-02-10");

      await service.findAll(1, {
        descricao,
        status: StatusGasto.PAGO,
        data_pgto_inicio: inicio,
        data_pgto_fim: fim,
        vencido: false,
        nome_categoria: categoria,
      });

      expect(getWhere()).toStrictEqual({
        ...BASE_WHERE,
        descricao: { contains: descricao },
        categoriaGasto: { nome: { contains: categoria } },
        data_pgto: {
          not: null,
          gte: inicio,
          lte: fim,
        },
        NOT: {
          AND: [{ data_pgto: null }, { data_venc: { lt: expect.any(Date) } }],
        },
      });
    });

    it("should apply all filters together NAO_PAGO and VENCIDO", async () => {
      const descricao = faker.string.alpha(10);
      const categoria = faker.string.alpha(10);
      const inicio = new Date("2026-02-01");
      const fim = new Date("2026-02-10");

      await service.findAll(1, {
        descricao,
        status: StatusGasto.NAO_PAGO,
        data_pgto_inicio: inicio,
        data_pgto_fim: fim,
        vencido: true,
        nome_categoria: categoria,
      });

      expect(getWhere()).toStrictEqual({
        ...BASE_WHERE,
        descricao: { contains: descricao },
        categoriaGasto: { nome: { contains: categoria } },
        data_pgto: {
          equals: null,
          gte: inicio,
          lte: fim,
        },
        AND: [{ data_pgto: null }, { data_venc: { lt: expect.any(Date) } }],
      });
    });

    it("should not add extra operators when no filters", async () => {
      await service.findAll(1, {});

      expect(getWhere()).toStrictEqual(BASE_WHERE);
    });
  });

  describe("findOne", () => {
    it("should return a single gasto fixo by id", async () => {
      const orcamento_id = faker.number.int();
      const gasto_fixo_id = faker.number.int();

      const gastoFixo = {
        id: gasto_fixo_id,
        descricao: "Gasto Fixo A",
        previsto: 1000.0,
        observacoes: "Descrição A",
        data_venc: faker.date.future(),
        data_criacao: new Date(),
        data_atualizacao: new Date(),
      };

      mockPrismaService.gastoFixo.findUnique.mockResolvedValue(gastoFixo);

      const result = await service.findOne(orcamento_id, gasto_fixo_id);

      expect(result).toEqual(gastoFixo);
      expect(mockPrismaService.gastoFixo.findUnique).toHaveBeenCalledWith({
        include: {
          categoriaGasto: true,
        },
        where: { id: gasto_fixo_id, orcamento_id, soft_delete: null },
      });
    });

    it("should return null if gasto fixo not found", async () => {
      const orcamento_id = faker.number.int();
      const gasto_fixo_id = 999;

      mockPrismaService.gastoFixo.findUnique.mockResolvedValue(null);

      const result = await service.findOne(orcamento_id, gasto_fixo_id);

      expect(result).toBeNull();
      expect(mockPrismaService.gastoFixo.findUnique).toHaveBeenCalledWith({
        include: {
          categoriaGasto: true,
        },
        where: { id: 999, orcamento_id, soft_delete: null },
      });
    });
  });

  describe("update", () => {
    it("should update a gasto fixo", async () => {
      const orcamento_id = faker.number.int();
      const gasto_fixo_id = faker.number.int();

      const updateGastoDto: GastoFixoUpdateDto = {
        descricao: "Gasto Fixo A Atualizado",
        previsto: "1500.00",
        observacoes: "Descrição do Gasto Fixo A Atualizado",
      };

      const updatedGastoFixo = {
        id: gasto_fixo_id,
        ...updateGastoDto,
        data_venc: faker.date.future(),
        data_criacao: new Date(),
        data_atualizacao: new Date(),
      };

      mockPrismaService.gastoFixo.update.mockResolvedValue(updatedGastoFixo);

      const result = await service.update(
        orcamento_id,
        gasto_fixo_id,
        updateGastoDto,
      );

      expect(result).toEqual(updatedGastoFixo);
      expect(mockPrismaService.gastoFixo.update).toHaveBeenCalledWith({
        include: {
          categoriaGasto: true,
        },
        where: { id: gasto_fixo_id, orcamento_id, soft_delete: null },
        data: updateGastoDto,
      });
    });
  });

  describe("softDelete", () => {
    it("should perform a soft delete of a gasto fixo", async () => {
      const orcamento_id = faker.number.int();
      const gasto_fixo_id = faker.number.int();

      const gastoFixoToDelete = {
        id: gasto_fixo_id,
        descricao: "Gasto Fixo A",
        previsto: "1000.00",
        observacoes: "Descrição A",
        data_venc: faker.date.future(),
      };

      const softDeletedGastoFixo = {
        ...gastoFixoToDelete,
        soft_delete: new Date(),
      };

      mockPrismaService.gastoFixo.update.mockResolvedValue(
        softDeletedGastoFixo,
      );

      const result = await service.softDelete(orcamento_id, gasto_fixo_id);

      expect(result).toEqual(softDeletedGastoFixo);
      expect(mockPrismaService.gastoFixo.update).toHaveBeenCalledWith({
        include: {
          categoriaGasto: true,
        },
        where: { id: gasto_fixo_id, orcamento_id, soft_delete: null },
        data: { soft_delete: expect.any(Date) },
      });
    });
  });
});

import { Test, TestingModule } from "@nestjs/testing";
import { GastosFixosService } from "./gastos-fixos.service";
import { PrismaService } from "../../prisma/prisma.service";
import { GastoFixoCreateDto } from "./dtos/GastoFixoCreate.dto";
import { GastoFixoUpdateDto } from "./dtos/GastoFixoUpdate.dto";
import { faker } from "@faker-js/faker";
import { GastoFixoFindDto, StatusGasto } from "./dtos/GastoFixoFind.dto";
import { CategoriaGasto, GastoFixo, Prisma } from "@prisma/client";
import { GastoFixoResponseDto } from "./dtos/GastoFixoResponse.dto";

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

      const createdGastoFixo: GastoFixo & { categoriaGasto: CategoriaGasto } = {
        id: gasto_fixo_id,
        descricao: createGastoDto.descricao,
        previsto: new Prisma.Decimal(createGastoDto.previsto),
        valor: null,
        diferenca: null,
        categoria_id: createGastoDto.categoria_id,
        orcamento_id,
        data_venc: createGastoDto.data_venc,
        data_pgto: null,
        soft_delete: null,
        data_criacao: new Date(),
        data_atualizacao: new Date(),
        data_inatividade: null,
        observacoes: null,
        categoriaGasto: {
          id: createGastoDto.categoria_id,
          nome: "Categoria Teste",
          data_criacao: new Date(),
          data_atualizacao: new Date(),
          data_inatividade: null,
          usuario_id: faker.number.int(),
          soft_delete: null,
        },
      };

      const expectedResponse: GastoFixoResponseDto = {
        id: createdGastoFixo.id,
        descricao: createdGastoFixo.descricao,
        previsto: createdGastoFixo.previsto.toString(),
        valor: null,
        diferenca: null,
        categoria_id: createdGastoFixo.categoria_id,
        orcamento_id: createdGastoFixo.orcamento_id,
        data_venc: createdGastoFixo.data_venc,
        data_pgto: createdGastoFixo.data_pgto,
        observacoes: createdGastoFixo.observacoes,
        data_criacao: createdGastoFixo.data_criacao,
        data_atualizacao: createdGastoFixo.data_atualizacao,
        data_inatividade: createdGastoFixo.data_inatividade,
        categoriaGasto: {
          id: createdGastoFixo.categoriaGasto.id,
          nome: createdGastoFixo.categoriaGasto.nome,
          data_criacao: createdGastoFixo.categoriaGasto.data_criacao,
          data_atualizacao: createdGastoFixo.categoriaGasto.data_atualizacao,
          data_inatividade: createdGastoFixo.categoriaGasto.data_inatividade,
        },
      };

      mockPrismaService.gastoFixo.create.mockResolvedValue(createdGastoFixo);

      const result = await service.create(orcamento_id, createGastoDto);

      expect(result).toStrictEqual(expectedResponse);
      expect(mockPrismaService.gastoFixo.create).toHaveBeenCalledWith({
        include: { categoriaGasto: true },
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

      const gastosFixos: (GastoFixo & { categoriaGasto: CategoriaGasto })[] = [
        {
          id: 1,
          descricao: "Gasto Fixo A",
          previsto: new Prisma.Decimal("1000.00"),
          valor: null,
          diferenca: null,
          observacoes: "Descrição A",
          categoria_id: 1,
          orcamento_id,
          data_venc: faker.date.future(),
          data_pgto: null,
          soft_delete: null,
          data_criacao: new Date(),
          data_atualizacao: new Date(),
          data_inatividade: null,
          categoriaGasto: {
            id: 1,
            nome: "Categoria A",
            data_criacao: new Date(),
            data_atualizacao: new Date(),
            data_inatividade: null,
            usuario_id: 1,
            soft_delete: null,
          },
        },
        {
          id: 2,
          descricao: "Gasto Fixo B",
          previsto: new Prisma.Decimal("500.00"),
          valor: null,
          diferenca: null,
          observacoes: "Descrição B",
          categoria_id: 2,
          orcamento_id,
          data_venc: faker.date.future(),
          data_pgto: null,
          soft_delete: null,
          data_criacao: new Date(),
          data_atualizacao: new Date(),
          data_inatividade: null,
          categoriaGasto: {
            id: 2,
            nome: "Categoria B",
            data_criacao: new Date(),
            data_atualizacao: new Date(),
            data_inatividade: null,
            usuario_id: 2,
            soft_delete: null,
          },
        },
      ];

      const expectedResponse: GastoFixoResponseDto[] = [{
        id: gastosFixos[0].id,
        descricao: gastosFixos[0].descricao,
        previsto: gastosFixos[0].previsto.toString(),
        valor: null,
        diferenca: null,
        categoria_id: gastosFixos[0].categoria_id,
        orcamento_id: gastosFixos[0].orcamento_id,
        data_venc: gastosFixos[0].data_venc,
        data_pgto: gastosFixos[0].data_pgto,
        observacoes: gastosFixos[0].observacoes,
        data_criacao: gastosFixos[0].data_criacao,
        data_atualizacao: gastosFixos[0].data_atualizacao,
        data_inatividade: gastosFixos[0].data_inatividade,
        categoriaGasto: {
          id: gastosFixos[0].categoriaGasto.id,
          nome: gastosFixos[0].categoriaGasto.nome,
          data_criacao: gastosFixos[0].categoriaGasto.data_criacao,
          data_atualizacao: gastosFixos[0].categoriaGasto.data_atualizacao,
          data_inatividade: gastosFixos[0].categoriaGasto.data_inatividade,
        },
      },{
        id: gastosFixos[1].id,
        descricao: gastosFixos[1].descricao,
        previsto: gastosFixos[1].previsto.toString(),
        valor: null,
        diferenca: null,
        categoria_id: gastosFixos[1].categoria_id,
        orcamento_id: gastosFixos[1].orcamento_id,
        data_venc: gastosFixos[1].data_venc,
        data_pgto: gastosFixos[1].data_pgto,
        observacoes: gastosFixos[1].observacoes,
        data_criacao: gastosFixos[1].data_criacao,
        data_atualizacao: gastosFixos[1].data_atualizacao,
        data_inatividade: gastosFixos[1].data_inatividade,
        categoriaGasto: {
          id: gastosFixos[1].categoriaGasto.id,
          nome: gastosFixos[1].categoriaGasto.nome,
          data_criacao: gastosFixos[1].categoriaGasto.data_criacao,
          data_atualizacao: gastosFixos[1].categoriaGasto.data_atualizacao,
          data_inatividade: gastosFixos[1].categoriaGasto.data_inatividade,
        },
      }];


      mockPrismaService.gastoFixo.findMany.mockResolvedValue(gastosFixos);

      const result = await service.findAll(orcamento_id, filters);

      expect(result).toStrictEqual(expectedResponse);
      expect(mockPrismaService.gastoFixo.findMany).toHaveBeenCalledWith({
        include: { categoriaGasto: true },
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
        data_pgto: { gte: inicio, lte: fim },
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
        categoriaGasto: { nome: { contains: nome } },
      });
    });

    it("should apply all filters together PAGO e NAO VENCIDO", async () => {
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
        data_pgto: { not: null, gte: inicio, lte: fim },
        NOT: {
          AND: [{ data_pgto: null }, { data_venc: { lt: expect.any(Date) } }],
        },
      });
    });

    it("should apply all filters together NAO_PAGO e VENCIDO", async () => {
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
        data_pgto: { equals: null, gte: inicio, lte: fim },
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

      const gastoFixo: GastoFixo & { categoriaGasto: CategoriaGasto } = {
        id: 1,
        descricao: "Gasto Fixo A",
        previsto: new Prisma.Decimal("1000.00"),
        valor: null,
        diferenca: null,
        observacoes: "Descrição A",
        categoria_id: 1,
        orcamento_id,
        data_venc: faker.date.future(),
        data_pgto: null,
        soft_delete: null,
        data_criacao: new Date(),
        data_atualizacao: new Date(),
        data_inatividade: null,
        categoriaGasto: {
          id: 1,
          nome: "Categoria A",
          data_criacao: new Date(),
          data_atualizacao: new Date(),
          data_inatividade: null,
          usuario_id: 1,
          soft_delete: null,
        },
      };

      const expectedResponse: GastoFixoResponseDto = {
        id: gastoFixo.id,
        descricao: gastoFixo.descricao,
        previsto: gastoFixo.previsto.toString(),
        valor: null,
        diferenca: null,
        categoria_id: gastoFixo.categoria_id,
        orcamento_id: gastoFixo.orcamento_id,
        data_venc: gastoFixo.data_venc,
        data_pgto: gastoFixo.data_pgto,
        observacoes: gastoFixo.observacoes,
        data_criacao: gastoFixo.data_criacao,
        data_atualizacao: gastoFixo.data_atualizacao,
        data_inatividade: gastoFixo.data_inatividade,
        categoriaGasto: {
          id: gastoFixo.categoriaGasto.id,
          nome: gastoFixo.categoriaGasto.nome,
          data_criacao: gastoFixo.categoriaGasto.data_criacao,
          data_atualizacao: gastoFixo.categoriaGasto.data_atualizacao,
          data_inatividade: gastoFixo.categoriaGasto.data_inatividade,
        },
      };

      mockPrismaService.gastoFixo.findUnique.mockResolvedValue(gastoFixo);

      const result = await service.findOne(orcamento_id, gasto_fixo_id);

      expect(result).toStrictEqual(expectedResponse);
      expect(mockPrismaService.gastoFixo.findUnique).toHaveBeenCalledWith({
        include: { categoriaGasto: true },
        where: { id: gasto_fixo_id, orcamento_id, soft_delete: null },
      });
    });

    it("should return null if gasto fixo not found", async () => {
      const orcamento_id = faker.number.int();
      const gasto_fixo_id = 999;

      mockPrismaService.gastoFixo.findUnique.mockResolvedValue(null);

      const result = await service.findOne(orcamento_id, gasto_fixo_id);

      expect(result).toBeNull();
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

      const updatedGastoFixo: GastoFixo & { categoriaGasto: CategoriaGasto } = {
        id: 1,
        descricao: "Gasto Fixo A",
        previsto: new Prisma.Decimal("1000.00"),
        valor: null,
        diferenca: null,
        observacoes: "Descrição A",
        categoria_id: 1,
        orcamento_id,
        data_venc: faker.date.future(),
        data_pgto: null,
        soft_delete: null,
        data_criacao: new Date(),
        data_atualizacao: new Date(),
        data_inatividade: null,
        categoriaGasto: {
          id: 1,
          nome: "Categoria A",
          data_criacao: new Date(),
          data_atualizacao: new Date(),
          data_inatividade: null,
          usuario_id: 1,
          soft_delete: null,
        },
      };

      const expectedResponse: GastoFixoResponseDto = {
        id: updatedGastoFixo.id,
        descricao: updatedGastoFixo.descricao,
        previsto: updatedGastoFixo.previsto.toString(),
        valor: null,
        diferenca: null,
        categoria_id: updatedGastoFixo.categoria_id,
        orcamento_id: updatedGastoFixo.orcamento_id,
        data_venc: updatedGastoFixo.data_venc,
        data_pgto: updatedGastoFixo.data_pgto,
        observacoes: updatedGastoFixo.observacoes,
        data_criacao: updatedGastoFixo.data_criacao,
        data_atualizacao: updatedGastoFixo.data_atualizacao,
        data_inatividade: updatedGastoFixo.data_inatividade,
        categoriaGasto: {
          id: updatedGastoFixo.categoriaGasto.id,
          nome: updatedGastoFixo.categoriaGasto.nome,
          data_criacao: updatedGastoFixo.categoriaGasto.data_criacao,
          data_atualizacao: updatedGastoFixo.categoriaGasto.data_atualizacao,
          data_inatividade: updatedGastoFixo.categoriaGasto.data_inatividade,
        },
      };

      mockPrismaService.gastoFixo.update.mockResolvedValue(updatedGastoFixo);

      const result = await service.update(
        orcamento_id,
        gasto_fixo_id,
        updateGastoDto,
      );
      expect(result).toStrictEqual(expectedResponse);
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

      const gastoFixoToDelete: GastoFixo & { categoriaGasto: CategoriaGasto } =
        {
          id: 1,
          descricao: "Gasto Fixo A",
          previsto: new Prisma.Decimal("1000.00"),
          valor: null,
          diferenca: null,
          observacoes: "Descrição A",
          categoria_id: 1,
          orcamento_id,
          data_venc: faker.date.future(),
          data_pgto: null,
          soft_delete: null,
          data_criacao: new Date(),
          data_atualizacao: new Date(),
          data_inatividade: null,
          categoriaGasto: {
            id: 1,
            nome: "Categoria A",
            data_criacao: new Date(),
            data_atualizacao: new Date(),
            data_inatividade: null,
            usuario_id: 1,
            soft_delete: null,
          },
        };

      const softDeletedGastoFixo: GastoFixo & { categoriaGasto: CategoriaGasto } = {
        ...gastoFixoToDelete,
        soft_delete: new Date(),
      };

      mockPrismaService.gastoFixo.update.mockResolvedValue(
        softDeletedGastoFixo,
      );

      const expectedResponse: GastoFixoResponseDto = {
        id: softDeletedGastoFixo.id,
        descricao: softDeletedGastoFixo.descricao,
        previsto: softDeletedGastoFixo.previsto.toString(),
        valor: null,
        diferenca: null,
        categoria_id: softDeletedGastoFixo.categoria_id,
        orcamento_id: softDeletedGastoFixo.orcamento_id,
        data_venc: softDeletedGastoFixo.data_venc,
        data_pgto: softDeletedGastoFixo.data_pgto,
        observacoes: softDeletedGastoFixo.observacoes,
        data_criacao: softDeletedGastoFixo.data_criacao,
        data_atualizacao: softDeletedGastoFixo.data_atualizacao,
        data_inatividade: softDeletedGastoFixo.data_inatividade,
        categoriaGasto: {
          id: softDeletedGastoFixo.categoriaGasto.id,
          nome: softDeletedGastoFixo.categoriaGasto.nome,
          data_criacao: softDeletedGastoFixo.categoriaGasto.data_criacao,
          data_atualizacao: softDeletedGastoFixo.categoriaGasto.data_atualizacao,
          data_inatividade: softDeletedGastoFixo.categoriaGasto.data_inatividade,
        },
      };

      const result = await service.softDelete(orcamento_id, gasto_fixo_id);
      expect(result).toStrictEqual(expectedResponse);
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

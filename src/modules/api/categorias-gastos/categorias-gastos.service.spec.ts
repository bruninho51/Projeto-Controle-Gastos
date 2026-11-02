import { ConflictException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { CategoriasGastosService } from "./categorias-gastos.service";
import { PrismaService } from "../../prisma/prisma.service";
import { CategoriaGasto, TipoCategoriaGasto } from "@prisma/client";
import { faker } from "@faker-js/faker";
import { CategoriaGastoResponseDto } from "./dtos/CategoriaGastoResponse.dto";
import { CategoriaGastoCreateDto } from "./dtos/CategoriaGastoCreate.dto";
import { CategoriaGastoUpdateDto } from "./dtos/CategoriaGastoUpdate.dto";
import { CategoriaGastoFindDto } from "./dtos/CategoriaGastoFind.dto";

describe("CategoriasGastosService", () => {
  let service: CategoriasGastosService;
  let prismaService: PrismaService;

  const prismaServiceMock = {
    categoriaGasto: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriasGastosService,
        {
          provide: PrismaService,
          useValue: prismaServiceMock,
        },
      ],
    }).compile();

    service = module.get<CategoriasGastosService>(CategoriasGastosService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  describe("findAll", () => {
    const BASE_WHERE = Object.freeze({
      usuario_id: 1,
      soft_delete: null,
    });

    function getLastFindManyWhere() {
      const calls = prismaServiceMock.categoriaGasto.findMany.mock.calls;
      if (!calls.length) throw new Error("findMany não foi chamado");
      return calls[calls.length - 1][0].where;
    }

    async function findAllWhere(filters: CategoriaGastoFindDto) {
      await service.findAll(1, filters);
      return getLastFindManyWhere();
    }

    it("should return an array of categorias de gastos", async () => {
      const now = new Date();
      const usuarioId = faker.number.int();

      const prismaResult: CategoriaGasto[] = [
        {
          id: 1,
          nome: "Alimentação",
          tipo: TipoCategoriaGasto.DESPESA,
          soft_delete: null,
          data_criacao: now,
          data_atualizacao: now,
          data_inatividade: null,
          usuario_id: usuarioId,
        },
      ];

      prismaServiceMock.categoriaGasto.findMany.mockResolvedValue(prismaResult);

      const categories = await service.findAll(usuarioId, {});

      const expected: CategoriaGastoResponseDto[] = [
        {
          id: prismaResult[0].id,
          nome: prismaResult[0].nome,
          tipo: prismaResult[0].tipo,
          data_criacao: prismaResult[0].data_criacao,
          data_atualizacao: prismaResult[0].data_atualizacao,
          data_inatividade: prismaResult[0].data_inatividade,
        },
      ];

      expect(categories).toEqual(expected);

      expect(prismaServiceMock.categoriaGasto.findMany).toHaveBeenCalledWith({
        where: { usuario_id: usuarioId, soft_delete: null },
      });
    });

    it("should filter by nome", async () => {
      const searchedValue = faker.string.alpha();
      expect(await findAllWhere({ nome: searchedValue })).toStrictEqual({
        ...BASE_WHERE,
        nome: { contains: searchedValue },
      });
    });

    it("should filter by tipo", async () => {
      expect(
        await findAllWhere({ tipo: TipoCategoriaGasto.PATRIMONIO }),
      ).toStrictEqual({
        ...BASE_WHERE,
        tipo: TipoCategoriaGasto.PATRIMONIO,
      });
    });
  });

  describe("findOne", () => {
    it("should return a single categoria gasto by id", async () => {
      const now = new Date();
      const usuarioId = faker.number.int();
      const id = faker.number.int();

      const prismaResult: CategoriaGasto = {
        id: id,
        nome: "Alimentação",
        tipo: TipoCategoriaGasto.DESPESA,
        soft_delete: null,
        data_criacao: now,
        data_atualizacao: now,
        data_inatividade: null,
        usuario_id: usuarioId,
      };

      prismaServiceMock.categoriaGasto.findUnique.mockResolvedValue(
        prismaResult,
      );

      const category = await service.findOne(usuarioId, id);

      const expected: CategoriaGastoResponseDto = {
        id: prismaResult.id,
        nome: prismaResult.nome,
        tipo: prismaResult.tipo,
        data_criacao: prismaResult.data_criacao,
        data_atualizacao: prismaResult.data_atualizacao,
        data_inatividade: prismaResult.data_inatividade,
      };

      expect(category).toEqual(expected);

      expect(prismaServiceMock.categoriaGasto.findUnique).toHaveBeenCalledWith({
        where: { id, usuario_id: usuarioId, soft_delete: null },
      });
    });

    it("should return null if categoria gastos not found", async () => {
      prismaServiceMock.categoriaGasto.findUnique.mockResolvedValue(null);

      const id = faker.number.int();
      const usuarioId = faker.number.int();

      const category = await service.findOne(usuarioId, id);

      expect(category).toBeNull();
    });
  });

  describe("create", () => {
    it("should create a new categoria de gasto", async () => {
      const now = new Date();
      const usuarioId = faker.number.int();

      const createCategoriaDto: CategoriaGastoCreateDto = {
        nome: "Transporte",
      };

      const prismaResult: CategoriaGasto = {
        id: 1,
        nome: createCategoriaDto.nome,
        tipo: TipoCategoriaGasto.DESPESA,
        soft_delete: null,
        data_criacao: now,
        data_atualizacao: now,
        data_inatividade: null,
        usuario_id: usuarioId,
      };

      prismaServiceMock.categoriaGasto.create.mockResolvedValue(prismaResult);

      const category = await service.create(usuarioId, createCategoriaDto);

      const expected: CategoriaGastoResponseDto = {
        id: prismaResult.id,
        nome: prismaResult.nome,
        tipo: prismaResult.tipo,
        data_criacao: prismaResult.data_criacao,
        data_atualizacao: prismaResult.data_atualizacao,
        data_inatividade: prismaResult.data_inatividade,
      };

      expect(category).toEqual(expected);

      expect(prismaServiceMock.categoriaGasto.create).toHaveBeenCalledWith({
        data: { ...createCategoriaDto, usuario_id: usuarioId },
      });
    });
  });

  describe("update", () => {
    it("should update an existing categoria de gasto", async () => {
      const now = new Date();
      const usuarioId = faker.number.int();
      const id = 1;

      const updateCategoriaDto: CategoriaGastoUpdateDto = { nome: "Saúde" };

      const prismaResult: CategoriaGasto = {
        id: id,
        nome: updateCategoriaDto.nome,
        tipo: TipoCategoriaGasto.DESPESA,
        soft_delete: null,
        data_criacao: now,
        data_atualizacao: now,
        data_inatividade: null,
        usuario_id: usuarioId,
      };

      prismaServiceMock.categoriaGasto.update.mockResolvedValue(prismaResult);

      const category = await service.update(usuarioId, id, updateCategoriaDto);

      const expected: CategoriaGastoResponseDto = {
        id: prismaResult.id,
        nome: prismaResult.nome,
        tipo: prismaResult.tipo,
        data_criacao: prismaResult.data_criacao,
        data_atualizacao: prismaResult.data_atualizacao,
        data_inatividade: prismaResult.data_inatividade,
      };

      expect(category).toEqual(expected);

      expect(prismaServiceMock.categoriaGasto.update).toHaveBeenCalledWith({
        where: { id, usuario_id: usuarioId, soft_delete: null },
        data: updateCategoriaDto,
      });
    });
  });

  describe("update tipo", () => {
    const usuarioId = 1;
    const id = 1;

    function mockCategoria(tipo: TipoCategoriaGasto, gastos: number) {
      prismaServiceMock.categoriaGasto.findUnique.mockResolvedValue({
        tipo,
        _count: { gastosFixos: gastos, gastosVariados: 0 },
      });
      prismaServiceMock.categoriaGasto.update.mockResolvedValue({
        id,
        nome: "Poupança",
        tipo: TipoCategoriaGasto.PATRIMONIO,
        soft_delete: null,
        data_criacao: new Date(),
        data_atualizacao: new Date(),
        data_inatividade: null,
        usuario_id: usuarioId,
      });
    }

    beforeEach(() => {
      prismaServiceMock.categoriaGasto.update.mockClear();
    });

    it("should change tipo when categoria has no gastos", async () => {
      mockCategoria(TipoCategoriaGasto.DESPESA, 0);

      const result = await service.update(usuarioId, id, {
        tipo: TipoCategoriaGasto.PATRIMONIO,
      });

      expect(result.tipo).toBe(TipoCategoriaGasto.PATRIMONIO);
      expect(prismaServiceMock.categoriaGasto.update).toHaveBeenCalled();
    });

    it("should throw ConflictException when changing tipo of categoria with gastos", async () => {
      mockCategoria(TipoCategoriaGasto.DESPESA, 2);

      await expect(
        service.update(usuarioId, id, { tipo: TipoCategoriaGasto.PATRIMONIO }),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(prismaServiceMock.categoriaGasto.update).not.toHaveBeenCalled();
    });

    it("should allow sending the same tipo even when categoria has gastos", async () => {
      mockCategoria(TipoCategoriaGasto.PATRIMONIO, 2);

      await service.update(usuarioId, id, {
        tipo: TipoCategoriaGasto.PATRIMONIO,
      });

      expect(prismaServiceMock.categoriaGasto.update).toHaveBeenCalled();
    });
  });

  describe("softDelete", () => {
    it("should soft delete a categoria de gasto", async () => {
      const id = 1;
      const now = new Date();
      const usuarioId = faker.number.int();

      const prismaResult: CategoriaGasto = {
        id,
        nome: "Transporte",
        tipo: TipoCategoriaGasto.DESPESA,
        soft_delete: now,
        data_criacao: now,
        data_atualizacao: now,
        data_inatividade: null,
        usuario_id: usuarioId,
      };

      prismaServiceMock.categoriaGasto.update.mockResolvedValue(prismaResult);

      const category = await service.softDelete(usuarioId, id);

      const expected: CategoriaGastoResponseDto = {
        id: prismaResult.id,
        nome: prismaResult.nome,
        tipo: prismaResult.tipo,
        data_criacao: prismaResult.data_criacao,
        data_atualizacao: prismaResult.data_atualizacao,
        data_inatividade: prismaResult.data_inatividade,
      };

      expect(category).toEqual(expected);

      expect(prismaServiceMock.categoriaGasto.update).toHaveBeenCalledWith({
        where: { id, usuario_id: usuarioId, soft_delete: null },
        data: { soft_delete: expect.any(Date) },
      });
    });
  });
});

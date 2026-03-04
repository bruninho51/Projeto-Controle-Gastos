import { Test, TestingModule } from "@nestjs/testing";
import { CategoriasGastosService } from "./categorias-gastos.service";
import { PrismaService } from "../../prisma/prisma.service";
import { CategoriaGasto } from "@prisma/client";
import { faker } from "@faker-js/faker";
import { CategoriaGastoResponseDto } from "./dtos/CategoriaGastoResponse.dto";
import { CategoriaGastoCreateDto } from "./dtos/CategoriaGastoCreate.dto";
import { CategoriaGastoUpdateDto } from "./dtos/CategoriaGastoUpdate.dto";

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
    it("should return an array of categorias de gastos", async () => {
      const now = new Date();
      const usuarioId = faker.number.int();

      const prismaResult: CategoriaGasto[] = [
        {
          id: 1,
          nome: "Alimentação",
          soft_delete: null,
          data_criacao: now,
          data_atualizacao: now,
          data_inatividade: null,
          usuario_id: usuarioId,
        },
      ];

      prismaServiceMock.categoriaGasto.findMany.mockResolvedValue(prismaResult);

      const categories = await service.findAll(usuarioId);

      const expected: CategoriaGastoResponseDto[] = [
        {
          id: prismaResult[0].id,
          nome: prismaResult[0].nome,
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
  });

  describe("findOne", () => {
    it("should return a single categoria gasto by id", async () => {
      const now = new Date();
      const usuarioId = faker.number.int();
      const id = faker.number.int();

      const prismaResult: CategoriaGasto = {
        id: id,
        nome: "Alimentação",
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

  describe("softDelete", () => {
    it("should soft delete a categoria de gasto", async () => {
      const id = 1;
      const now = new Date();
      const usuarioId = faker.number.int();

      const prismaResult: CategoriaGasto = {
        id,
        nome: "Transporte",
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

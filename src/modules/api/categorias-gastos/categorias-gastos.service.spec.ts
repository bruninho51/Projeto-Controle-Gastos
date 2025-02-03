import { Test, TestingModule } from "@nestjs/testing";
import { CategoriasGastosService } from "./categorias-gastos.service";
import { PrismaService } from "../../prisma/prisma.service";
import { CategoriaGasto } from "@prisma/client";
import { faker } from "@faker-js/faker";

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
      const result = [{ id: 1, nome: "Alimentação" }] as CategoriaGasto[];
      prismaServiceMock.categoriaGasto.findMany.mockResolvedValue(result);

      const usuarioId = faker.number.int();

      const categories = await service.findAll(usuarioId);
      expect(categories).toEqual(result);
      expect(prismaServiceMock.categoriaGasto.findMany).toHaveBeenCalledWith({
        where: { usuario_id: usuarioId, soft_delete: null },
      });
    });
  });

  describe("findOne", () => {
    it("should return a single categoria gasto by id", async () => {
      const result = { id: 1, nome: "Alimentação" } as CategoriaGasto;
      prismaServiceMock.categoriaGasto.findUnique.mockResolvedValue(result);

      const id = faker.number.int();
      const usuarioId = faker.number.int();

      const category = await service.findOne(usuarioId, id);
      expect(category).toEqual(result);
      expect(prismaServiceMock.categoriaGasto.findUnique).toHaveBeenCalledWith({
        where: { id, usuario_id: usuarioId, soft_delete: null },
      });
    });

    it("should return null if categoria gastos not found", async () => {
      const result = null;
      prismaServiceMock.categoriaGasto.findUnique.mockResolvedValue(result);

      const id = faker.number.int();
      const usuarioId = faker.number.int();

      const category = await service.findOne(usuarioId, id);
      expect(category).toBeNull();
    });
  });

  describe("create", () => {
    it("should create a new categoria de gasto", async () => {
      const createCategoriaDto = { nome: "Transporte" };
      const result = { id: 1, ...createCategoriaDto } as CategoriaGasto;
      prismaServiceMock.categoriaGasto.create.mockResolvedValue(result);

      const usuarioId = faker.number.int();

      const category = await service.create(usuarioId, createCategoriaDto);
      expect(category).toEqual(result);
      expect(prismaServiceMock.categoriaGasto.create).toHaveBeenCalledWith({
        data: { ...createCategoriaDto, usuario_id: usuarioId },
      });
    });
  });

  describe("update", () => {
    it("should update an existing categoria de gasto", async () => {
      const id = 1;
      const updateCategoriaDto = { nome: "Saúde" };
      const result = { id, ...updateCategoriaDto } as CategoriaGasto;
      prismaServiceMock.categoriaGasto.update.mockResolvedValue(result);

      const usuarioId = faker.number.int();

      const category = await service.update(usuarioId, id, updateCategoriaDto);
      expect(category).toEqual(result);
      expect(prismaServiceMock.categoriaGasto.update).toHaveBeenCalledWith({
        where: { id, usuario_id: usuarioId, soft_delete: null },
        data: updateCategoriaDto,
      });
    });
  });

  describe("softDelete", () => {
    it("should soft delete a categoria de gasto", async () => {
      const id = 1;
      const result = {
        id,
        nome: "Transporte",
        soft_delete: new Date(),
      } as CategoriaGasto;
      prismaServiceMock.categoriaGasto.update.mockResolvedValue(result);

      const usuarioId = faker.number.int();

      const category = await service.softDelete(usuarioId, id);
      expect(category).toEqual(result);
      expect(prismaServiceMock.categoriaGasto.update).toHaveBeenCalledWith({
        where: { id, usuario_id: usuarioId, soft_delete: null },
        data: { soft_delete: expect.any(Date) },
      });
    });
  });
});

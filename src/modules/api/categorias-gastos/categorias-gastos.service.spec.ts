import { Test, TestingModule } from "@nestjs/testing";
import { CategoriasGastosService } from "./categorias-gastos.service";
import { PrismaService } from "../../prisma/prisma.service";
import { CategoriaGasto } from "@prisma/client";

describe("CategoriasGastosService", () => {
  let service: CategoriasGastosService;
  let prismaService: PrismaService;

  const prismaServiceMock = {
    categoriaGasto: {
      findMany: jest.fn(),
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

      const categories = await service.findAll();
      expect(categories).toEqual(result);
      expect(prismaServiceMock.categoriaGasto.findMany).toHaveBeenCalledWith({
        where: { soft_delete: null },
      });
    });
  });

  describe("create", () => {
    it("should create a new categoria de gasto", async () => {
      const createCategoriaDto = { nome: "Transporte" };
      const result = { id: 1, ...createCategoriaDto } as CategoriaGasto;
      prismaServiceMock.categoriaGasto.create.mockResolvedValue(result);

      const category = await service.create(createCategoriaDto);
      expect(category).toEqual(result);
      expect(prismaServiceMock.categoriaGasto.create).toHaveBeenCalledWith({
        data: createCategoriaDto,
      });
    });
  });

  describe("update", () => {
    it("should update an existing categoria de gasto", async () => {
      const id = 1;
      const updateCategoriaDto = { nome: "Saúde" };
      const result = { id, ...updateCategoriaDto } as CategoriaGasto;
      prismaServiceMock.categoriaGasto.update.mockResolvedValue(result);

      const category = await service.update(id, updateCategoriaDto);
      expect(category).toEqual(result);
      expect(prismaServiceMock.categoriaGasto.update).toHaveBeenCalledWith({
        where: { id, soft_delete: null },
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

      const category = await service.softDelete(id);
      expect(category).toEqual(result);
      expect(prismaServiceMock.categoriaGasto.update).toHaveBeenCalledWith({
        where: { id, soft_delete: null },
        data: { soft_delete: expect.any(Date) },
      });
    });
  });
});

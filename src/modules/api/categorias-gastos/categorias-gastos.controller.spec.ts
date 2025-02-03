import { Test, TestingModule } from "@nestjs/testing";
import { CategoriasGastosController } from "./categorias-gastos.controller";
import { CategoriasGastosService } from "./categorias-gastos.service";
import { CategoriaGastoCreateDto } from "./dtos/CategoriaGastoCreate.dto";
import { CategoriaGastoUpdateDto } from "./dtos/CategoriaGastoUpdate.dto";
import { CategoriaGasto } from "@prisma/client";
import { faker } from "@faker-js/faker";

describe("CategoriasGastosController", () => {
  let controller: CategoriasGastosController;
  let service: CategoriasGastosService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoriasGastosController],
      providers: [
        {
          provide: CategoriasGastosService,
          useValue: {
            findAll: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            softDelete: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<CategoriasGastosController>(
      CategoriasGastosController,
    );
    service = module.get<CategoriasGastosService>(CategoriasGastosService);
  });

  describe("findAll", () => {
    it("should return an array of categorias de gastos", async () => {
      const result = [{ id: 1, nome: "Alimentação" }] as CategoriaGasto[];
      jest.spyOn(service, "findAll").mockResolvedValue(result);

      const usuarioId = faker.number.int();

      expect(await controller.findAll({ user: { id: usuarioId } })).toBe(result);
      expect(service.findAll).toHaveBeenCalledWith(usuarioId);
    });
  });

  describe("create", () => {
    it("should create a new categoria de gasto", async () => {
      const createCategoriaDto: CategoriaGastoCreateDto = {
        nome: "Transporte",
      };
      const result = { id: 1, ...createCategoriaDto } as CategoriaGasto;

      const usuarioId = faker.number.int();

      jest.spyOn(service, "create").mockResolvedValue(result);

      expect(await controller.create({ user: { id: usuarioId } }, createCategoriaDto)).toBe(result);
      expect(service.create).toHaveBeenCalledWith(usuarioId, createCategoriaDto);
    });
  });

  describe("update", () => {
    it("should update an existing categoria de gasto", async () => {
      const id = 1;
      const updateCategoriaDto: CategoriaGastoUpdateDto = { nome: "Saúde" };
      const result = { id, ...updateCategoriaDto } as CategoriaGasto;

      const usuarioId = faker.number.int();

      jest.spyOn(service, "update").mockResolvedValue(result);

      expect(await controller.update({ user: { id: usuarioId } }, id, updateCategoriaDto)).toBe(result);
      expect(service.update).toHaveBeenCalledWith(usuarioId, id, updateCategoriaDto);
    });
  });

  describe("remove", () => {
    it("should delete a categoria de gasto (soft delete)", async () => {
      const id = 1;
      const result = { id, soft_delete: new Date() } as CategoriaGasto;

      const usuarioId = faker.number.int();

      jest.spyOn(service, "softDelete").mockResolvedValue(result);

      expect(await controller.remove({ user: { id: usuarioId } }, id)).toBe(result);
      expect(service.softDelete).toHaveBeenCalledWith(usuarioId, id);
    });
  });
});

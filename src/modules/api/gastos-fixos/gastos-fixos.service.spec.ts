import { Test, TestingModule } from "@nestjs/testing";
import { GastosFixosService } from "./gastos-fixos.service";
import { PrismaService } from "../../prisma/prisma.service";
import { GastoFixoCreateDto } from "./dtos/GastoFixoCreate.dto";
import { GastoFixoUpdateDto } from "./dtos/GastoFixoUpdate.dto";
import { faker } from "@faker-js/faker";

const mockPrismaService = {
  gastoFixo: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
};

describe("GastosFixosService", () => {
  let service: GastosFixosService;

  beforeEach(async () => {
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
        data: { ...createGastoDto, orcamento_id },
      });
    });
  });

  describe("findAll", () => {
    it("should return an array of gasto fixo", async () => {
      const orcamento_id = faker.number.int();

      const gastosFixos = [
        {
          id: 1,
          descricao: "Gasto Fixo A",
          previsto: "1000.00",
          observacoes: "Descrição A",
        },
        {
          id: 2,
          descricao: "Gasto Fixo B",
          previsto: "500.00",
          observacoes: "Descrição B",
        },
      ];

      mockPrismaService.gastoFixo.findMany.mockResolvedValue(gastosFixos);

      const result = await service.findAll(orcamento_id);

      expect(result).toEqual(gastosFixos);
      expect(mockPrismaService.gastoFixo.findMany).toHaveBeenCalledWith({
        where: { orcamento_id, soft_delete: null },
      });
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
        data_criacao: new Date(),
        data_atualizacao: new Date(),
      };

      mockPrismaService.gastoFixo.findUnique.mockResolvedValue(gastoFixo);

      const result = await service.findOne(orcamento_id, gasto_fixo_id);

      expect(result).toEqual(gastoFixo);
      expect(mockPrismaService.gastoFixo.findUnique).toHaveBeenCalledWith({
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
        where: { id: gasto_fixo_id, orcamento_id, soft_delete: null },
        data: { soft_delete: expect.any(Date) },
      });
    });
  });
});

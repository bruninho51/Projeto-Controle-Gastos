import { Test, TestingModule } from "@nestjs/testing";
import { InvestimentosService } from "./investimentos.service";
import { PrismaService } from "../../../modules/prisma/prisma.service";
import { InvestimentoCreateDto } from "./dtos/InvestimentoCreate.dto";
import { InvestimentoUpdateDto } from "./dtos/InvestimentoUpdate.dto";
import { faker } from "@faker-js/faker";

const mockPrismaService = {
  investimento: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

describe("InvestimentosService", () => {
  let service: InvestimentosService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvestimentosService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<InvestimentosService>(InvestimentosService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("create", () => {
    it("should create a new investimento", async () => {
      const createInvestimentoDto: InvestimentoCreateDto = {
        nome: faker.string.alphanumeric(5),
        descricao: faker.string.alphanumeric(5),
        valor_inicial: faker.number
          .float({ min: 1000, max: 9999, fractionDigits: 2 })
          .toString(),
        categoria_id: 1,
      };

      const createdInvestimento = {
        id: 1,
        ...createInvestimentoDto,
        data_criacao: new Date(),
        data_atualizacao: new Date(),
      };

      mockPrismaService.investimento.create.mockResolvedValue(
        createdInvestimento,
      );

      const result = await service.create(createInvestimentoDto);

      expect(result).toEqual(createdInvestimento);
      expect(mockPrismaService.investimento.create).toHaveBeenCalledWith({
        data: createInvestimentoDto,
      });
    });
  });

  describe("findAll", () => {
    it("should return an array of investimentos", async () => {
      const investimentos = [
        {
          id: 1,
          nome: faker.string.alphanumeric(5),
          descricao: faker.string.alphanumeric(5),
          valor_inicial: faker.number
            .float({ min: 1000, max: 9999, fractionDigits: 2 })
            .toString(),
          categoria_id: 1,
          data_criacao: new Date(),
          data_atualizacao: new Date(),
        },
        {
          id: 2,
          nome: faker.string.alphanumeric(5),
          descricao: faker.string.alphanumeric(5),
          valor_inicial: faker.number
            .float({ min: 1000, max: 9999, fractionDigits: 2 })
            .toString(),
          categoria_id: 1,
          data_criacao: new Date(),
          data_atualizacao: new Date(),
        },
      ];

      mockPrismaService.investimento.findMany.mockResolvedValue(investimentos);

      const result = await service.findAll();

      expect(result).toEqual(investimentos);
      expect(mockPrismaService.investimento.findMany).toHaveBeenCalled();
    });
  });

  describe("findOne", () => {
    it("should return a single investimento by id", async () => {
      const investimento = {
        id: 1,
        nome: faker.string.alphanumeric(5),
        descricao: faker.string.alphanumeric(5),
        valor_inicial: faker.number
          .float({ min: 1000, max: 9999, fractionDigits: 2 })
          .toString(),
        categoria_id: 1,
        data_criacao: new Date(),
        data_atualizacao: new Date(),
      };

      mockPrismaService.investimento.findUnique.mockResolvedValue(investimento);

      const result = await service.findOne(1);

      expect(result).toEqual(investimento);
      expect(mockPrismaService.investimento.findUnique).toHaveBeenCalledWith({
        where: { id: 1, soft_delete: null },
      });
    });

    it("should return null if investimento not found", async () => {
      mockPrismaService.investimento.findUnique.mockResolvedValue(null);

      const result = await service.findOne(999);

      expect(result).toBeNull();
      expect(mockPrismaService.investimento.findUnique).toHaveBeenCalledWith({
        where: { id: 999, soft_delete: null },
      });
    });
  });

  describe("update", () => {
    it("should update an investimento", async () => {
      const updateInvestimentoDto: InvestimentoUpdateDto = {
        nome: faker.string.alphanumeric(5),
        valor_inicial: faker.number
          .float({ min: 1000, max: 9999, fractionDigits: 2 })
          .toString(),
      };

      const updatedInvestimento = {
        id: 1,
        nome: updateInvestimentoDto.nome,
        descricao: faker.string.alphanumeric(5),
        valor_inicial: updateInvestimentoDto.valor_inicial,
        categoria_id: 1,
        data_criacao: new Date(),
        data_atualizacao: new Date(),
      };

      mockPrismaService.investimento.update.mockResolvedValue(
        updatedInvestimento,
      );

      const result = await service.update(1, updateInvestimentoDto);

      expect(result).toEqual(updatedInvestimento);
      expect(mockPrismaService.investimento.update).toHaveBeenCalledWith({
        where: { id: 1, soft_delete: null },
        data: updateInvestimentoDto,
      });
    });
  });

  describe("softDelete", () => {
    it("should perform a soft delete of an investimento", async () => {
      const softDeletedInvestimento = {
        id: 1,
        nome: faker.string.alphanumeric(5),
        descricao: faker.string.alphanumeric(5),
        valor_inicial: faker.number
          .float({ min: 1000, max: 9999, fractionDigits: 2 })
          .toString(),
        categoria_id: 1,
        data_criacao: new Date(),
        data_atualizacao: new Date(),
        soft_delete: new Date(),
      };

      mockPrismaService.investimento.update.mockResolvedValue(
        softDeletedInvestimento,
      );

      const result = await service.softDelete(1);

      expect(result).toEqual(softDeletedInvestimento);
      expect(mockPrismaService.investimento.update).toHaveBeenCalledWith({
        where: { id: 1, soft_delete: null },
        data: { soft_delete: expect.any(Date) },
      });
    });
  });
});

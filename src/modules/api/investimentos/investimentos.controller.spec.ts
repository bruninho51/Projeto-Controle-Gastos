import { Test, TestingModule } from "@nestjs/testing";
import { InvestimentosController } from "./investimentos.controller";
import { InvestimentosService } from "./investimentos.service";
import { InvestimentoCreateDto } from "./dtos/InvestimentoCreate.dto";
import { InvestimentoUpdateDto } from "./dtos/InvestimentoUpdate.dto";
import { faker } from "@faker-js/faker";

const mockInvestimentosService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  softDelete: jest.fn(),
};

describe("InvestimentosController", () => {
  let controller: InvestimentosController;
  let service: InvestimentosService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InvestimentosController],
      providers: [
        InvestimentosService,
        {
          provide: InvestimentosService,
          useValue: mockInvestimentosService,
        },
      ],
    }).compile();

    controller = module.get<InvestimentosController>(InvestimentosController);
    service = module.get<InvestimentosService>(InvestimentosService);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
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
        ...createInvestimentoDto,
        id: 1,
        data_criacao: new Date(),
        data_atualizacao: new Date(),
      };

      mockInvestimentosService.create.mockResolvedValue(createdInvestimento);

      const result = await controller.create(createInvestimentoDto);

      expect(result).toEqual(createdInvestimento);
      expect(service.create).toHaveBeenCalledWith(createInvestimentoDto);
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
        },
        {
          id: 2,
          nome: faker.string.alphanumeric(5),
          descricao: faker.string.alphanumeric(5),
          valor_inicial: faker.number
            .float({ min: 1000, max: 9999, fractionDigits: 2 })
            .toString(),
          categoria_id: 1,
        },
      ];

      mockInvestimentosService.findAll.mockResolvedValue(investimentos);

      const result = await controller.findAll();

      expect(result).toEqual(investimentos);
      expect(service.findAll).toHaveBeenCalled();
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
      };

      mockInvestimentosService.findOne.mockResolvedValue(investimento);

      const result = await controller.findOne("1");

      expect(result).toEqual(investimento);
      expect(service.findOne).toHaveBeenCalledWith(1);
    });

    it("should return null if investimento not found", async () => {
      mockInvestimentosService.findOne.mockResolvedValue(null);

      const result = await controller.findOne("999");

      expect(result).toBeNull();
      expect(service.findOne).toHaveBeenCalledWith(999);
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
      };

      mockInvestimentosService.update.mockResolvedValue(updatedInvestimento);

      const result = await controller.update("1", updateInvestimentoDto);

      expect(result).toEqual(updatedInvestimento);
      expect(service.update).toHaveBeenCalledWith(1, updateInvestimentoDto);
    });
  });

  describe("remove", () => {
    it("should perform a soft delete of an investimento", async () => {
      const investimentoToDelete = {
        id: 1,
        nome: faker.string.alphanumeric(5),
        descricao: faker.string.alphanumeric(5),
        valor_inicial: faker.number
          .float({ min: 1000, max: 9999, fractionDigits: 2 })
          .toString(),
        categoria_id: 1,
        soft_delete: new Date(),
      };

      mockInvestimentosService.softDelete.mockResolvedValue(
        investimentoToDelete,
      );

      const result = await controller.remove("1");

      expect(result).toEqual(investimentoToDelete);
      expect(service.softDelete).toHaveBeenCalledWith(1);
    });
  });
});

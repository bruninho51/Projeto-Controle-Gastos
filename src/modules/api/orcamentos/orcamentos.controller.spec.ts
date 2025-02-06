import { Test, TestingModule } from "@nestjs/testing";
import { OrcamentosController } from "./orcamentos.controller";
import { OrcamentosService } from "./orcamentos.service";
import { OrcamentoCreateDto } from "./dtos/OrcamentoCreate.dto";
import { OrcamentoUpdateDto } from "./dtos/OrcamentoUpdate.dto";
import { faker } from "@faker-js/faker";

const mockOrcamentosService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  softDelete: jest.fn(),
};

describe("OrcamentoController", () => {
  let controller: OrcamentosController;
  let service: OrcamentosService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrcamentosController],
      providers: [
        OrcamentosService,
        {
          provide: OrcamentosService,
          useValue: mockOrcamentosService,
        },
      ],
    }).compile();

    controller = module.get<OrcamentosController>(OrcamentosController);
    service = module.get<OrcamentosService>(OrcamentosService);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("create", () => {
    it("should create a new orcamento", async () => {
      const createOrcamentoDto: OrcamentoCreateDto = {
        nome: "Orçamento A",
        valor_inicial: "1000.00",
      };

      const createdOrcamento = {
        ...createOrcamentoDto,
        id: 1,
        data_criacao: new Date(),
        data_atualizacao: new Date(),
      };

      mockOrcamentosService.create.mockResolvedValue(createdOrcamento);

      const userId = faker.number.int();

      const result = await controller.create(
        { user: { id: userId } },
        createOrcamentoDto,
      );

      expect(result).toEqual(createdOrcamento);
      expect(service.create).toHaveBeenCalledWith(userId, createOrcamentoDto);
    });
  });

  describe("findAll", () => {
    it("should return an array of orcamentos", async () => {
      const orcamentos = [
        {
          id: 1,
          nome: "Orçamento A",
          valor_inicial: "1000.00",
          valor_atual: "1200.00",
          valor_livre: "200.00",
        },
        {
          id: 2,
          nome: "Orçamento B",
          valor_inicial: "500.00",
          valor_atual: "600.00",
          valor_livre: "100.00",
        },
      ];

      mockOrcamentosService.findAll.mockResolvedValue(orcamentos);

      const userId = faker.number.int();

      const result = await controller.findAll({ user: { id: userId } });

      expect(result).toEqual(orcamentos);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe("findOne", () => {
    it("should return a single orcamento by id", async () => {
      const orcamento = {
        id: 1,
        nome: "Orçamento A",
        valor_inicial: "1000.00",
        valor_atual: "1200.00",
        valor_livre: "200.00",
      };

      mockOrcamentosService.findOne.mockResolvedValue(orcamento);

      const userId = faker.number.int();

      const result = await controller.findOne({ user: { id: userId } }, "1");

      expect(result).toEqual(orcamento);
      expect(service.findOne).toHaveBeenCalledWith(userId, 1);
    });

    it("should return null if orcamento not found", async () => {
      mockOrcamentosService.findOne.mockResolvedValue(null);

      const userId = faker.number.int();

      const result = await controller.findOne({ user: { id: userId } }, "999");

      expect(result).toBeNull();
      expect(service.findOne).toHaveBeenCalledWith(userId, 999);
    });
  });

  describe("update", () => {
    it("should update an orcamento", async () => {
      const updateOrcamentoDto: OrcamentoUpdateDto = {
        nome: "Orçamento A Atualizado",
        valor_inicial: "1300.00",
      };

      const updatedOrcamento: OrcamentoUpdateDto = {
        nome: "Orçamento A Atualizado",
        valor_inicial: "1000.00",
      };

      mockOrcamentosService.update.mockResolvedValue(updatedOrcamento);

      const userId = faker.number.int();

      const result = await controller.update(
        { user: { id: userId } },
        "1",
        updateOrcamentoDto,
      );

      expect(result).toEqual(updatedOrcamento);
      expect(service.update).toHaveBeenCalledWith(
        userId,
        1,
        updateOrcamentoDto,
      );
    });
  });

  describe("remove", () => {
    it("should perform a soft delete of an orcamento", async () => {
      const orcamentoToDelete = {
        id: 1,
        nome: "Orçamento A",
        valor_inicial: "1000.00",
      };

      mockOrcamentosService.softDelete.mockResolvedValue(orcamentoToDelete);

      const userId = faker.number.int();

      const result = await controller.remove({ user: { id: userId } }, "1");

      expect(result).toEqual(orcamentoToDelete);
      expect(service.softDelete).toHaveBeenCalledWith(userId, 1);
    });
  });
});

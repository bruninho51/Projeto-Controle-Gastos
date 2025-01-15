import { Test, TestingModule } from "@nestjs/testing";
import { GastosVariadosController } from "./gastos-variados.controller";
import { GastosVariadosService } from "./gastos-variados.service";
import { GastoVariadoCreateDto } from "./dtos/GastoVariadoCreate.dto";
import { GastoVariadoUpdateDto } from "./dtos/GastoVariadoUpdate.dto";
import { faker } from "@faker-js/faker";

const mockGastosVariadosService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  softDelete: jest.fn(),
};

describe("GastosVariadosController", () => {
  let controller: GastosVariadosController;
  let service: GastosVariadosService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GastosVariadosController],
      providers: [
        GastosVariadosService,
        {
          provide: GastosVariadosService,
          useValue: mockGastosVariadosService,
        },
      ],
    }).compile();

    controller = module.get<GastosVariadosController>(GastosVariadosController);
    service = module.get<GastosVariadosService>(GastosVariadosService);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("create", () => {
    it("should create a new gasto variado", async () => {
      const orcamento_id = faker.number.int().toString();

      const createGastoDto: GastoVariadoCreateDto = {
        descricao: faker.string.alphanumeric(5),
        observacoes: faker.string.alphanumeric(5),
        categoria_id: faker.number.int(),
        valor: faker.number
          .float({ min: 100, max: 9999, fractionDigits: 2 })
          .toString(),
        data_pgto: new Date(),
      };

      const createdGasto = {
        ...createGastoDto,
        id: 1,
        data_criacao: new Date(),
        data_atualizacao: new Date(),
      };

      mockGastosVariadosService.create.mockResolvedValue(createdGasto);

      const result = await controller.create(orcamento_id, createGastoDto);

      expect(result).toEqual(createdGasto);
      expect(service.create).toHaveBeenCalledWith(
        +orcamento_id,
        createGastoDto,
      );
    });
  });

  describe("findAll", () => {
    it("should return an array of gastos variados", async () => {
      const orcamento_id = faker.number.int().toString();

      const gastos = [
        {
          id: 1,
          descricao: "Aluguel",
          valor: "1200.00",
          data_pgto: new Date(),
        },
        {
          id: 2,
          descricao: "Internet",
          valor: "150.00",
          data_pgto: new Date(),
        },
      ];

      mockGastosVariadosService.findAll.mockResolvedValue(gastos);

      const result = await controller.findAll(orcamento_id);

      expect(result).toEqual(gastos);
      expect(service.findAll).toHaveBeenCalledWith(+orcamento_id);
    });
  });

  describe("findOne", () => {
    it("should return a gasto variado by id", async () => {
      const orcamento_id = faker.number.int().toString();
      const gasto_variado_id = faker.number.int().toString();

      const gasto = {
        id: gasto_variado_id,
        descricao: "Aluguel",
        valor: "1200.00",
        data_pgto: new Date(),
      };

      mockGastosVariadosService.findOne.mockResolvedValue(gasto);

      const result = await controller.findOne(orcamento_id, gasto_variado_id);

      expect(result).toEqual(gasto);
      expect(service.findOne).toHaveBeenCalledWith(
        +orcamento_id,
        +gasto_variado_id,
      );
    });

    it("should return null if gasto variado not found", async () => {
      const orcamento_id = faker.number.int().toString();
      const gasto_variado_id = "999";

      mockGastosVariadosService.findOne.mockResolvedValue(null);

      const result = await controller.findOne(orcamento_id, gasto_variado_id);

      expect(result).toBeNull();
      expect(service.findOne).toHaveBeenCalledWith(
        +orcamento_id,
        +gasto_variado_id,
      );
    });
  });

  describe("update", () => {
    it("should update a gasto variado", async () => {
      const orcamento_id = faker.number.int().toString();
      const gasto_variado_id = faker.number.int().toString();

      const updateGastoDto: GastoVariadoUpdateDto = {
        descricao: "Aluguel Atualizado",
        valor: "1300.00",
        data_pgto: new Date(),
      };

      const updatedGasto = {
        ...updateGastoDto,
        id: 1,
        data_atualizacao: new Date(),
      };

      mockGastosVariadosService.update.mockResolvedValue(updatedGasto);

      const result = await controller.update(
        orcamento_id,
        gasto_variado_id,
        updateGastoDto,
      );

      expect(result).toEqual(updatedGasto);
      expect(service.update).toHaveBeenCalledWith(
        +orcamento_id,
        +gasto_variado_id,
        updateGastoDto,
      );
    });
  });

  describe("remove", () => {
    it("should perform a soft delete of a gasto variado", async () => {
      const orcamento_id = faker.number.int().toString();
      const gasto_variado_id = faker.number.int().toString();

      const gastoToDelete = {
        id: gasto_variado_id,
        descricao: "Aluguel",
        valor: "1200.00",
        data_pgto: new Date(),
      };

      mockGastosVariadosService.softDelete.mockResolvedValue(gastoToDelete);

      const result = await controller.remove(orcamento_id, gasto_variado_id);

      expect(result).toEqual(gastoToDelete);
      expect(service.softDelete).toHaveBeenCalledWith(
        +orcamento_id,
        +gasto_variado_id,
      );
    });
  });
});

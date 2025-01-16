import { Test, TestingModule } from "@nestjs/testing";
import { LinhaDoTempoInvestimentosController } from "./linha-do-tempo-investimentos.controller";
import { LinhaDoTempoInvestimentosService } from "./linha-do-tempo-investimentos.service";
import { faker } from "@faker-js/faker";
import { RegistroInvestimentoLinhaDoTempoCreateDto } from "./dtos/RegistroInvestimentoLinhaDoTempoCreate.dto";
import { RegistroInvestimentoLinhaDoTempoUpdateDto } from "./dtos/RegistroInvestimentoLinhaDoTempoUpdate.dto";

const mockLinhaDoTempoService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  softDelete: jest.fn(),
};

describe("LinhaDoTempoInvestimentosController", () => {
  let controller: LinhaDoTempoInvestimentosController;
  let service: LinhaDoTempoInvestimentosService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LinhaDoTempoInvestimentosController],
      providers: [
        LinhaDoTempoInvestimentosService,
        {
          provide: LinhaDoTempoInvestimentosService,
          useValue: mockLinhaDoTempoService,
        },
      ],
    }).compile();

    controller = module.get<LinhaDoTempoInvestimentosController>(LinhaDoTempoInvestimentosController);
    service = module.get<LinhaDoTempoInvestimentosService>(LinhaDoTempoInvestimentosService);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("create", () => {
    it("should create a new linha do tempo investimento", async () => {
      const investimento_id = faker.number.int().toString();

      const createLinhaDoTempoDto: RegistroInvestimentoLinhaDoTempoCreateDto = {
        valor: faker.number
          .float({ min: 100, max: 9999, fractionDigits: 2 })
          .toString(),
        data_registro: new Date(),
      };

      const createdLinhaDoTempo = {
        id: 1,
        ...createLinhaDoTempoDto,
        data_criacao: new Date(),
        data_atualizacao: new Date(),
      };

      mockLinhaDoTempoService.create.mockResolvedValue(createdLinhaDoTempo);

      const result = await controller.create(investimento_id, createLinhaDoTempoDto);

      expect(result).toEqual(createdLinhaDoTempo);
      expect(service.create).toHaveBeenCalledWith(
        +investimento_id,
        createLinhaDoTempoDto,
      );
    });
  });

  describe("findAll", () => {
    it("should return an array of linha do tempo investimento", async () => {
      const investimento_id = faker.number.int().toString();

      const linhaDoTempo = [
        {
          id: 1,
          valor: faker.number
          .float({ min: 100, max: 9999, fractionDigits: 2 })
          .toString(),
          data_registro: new Date(),
          data_criacao: new Date(),
          data_atualizacao: new Date(),
        },
        {
          id: 2,
          valor: faker.number
          .float({ min: 100, max: 9999, fractionDigits: 2 })
          .toString(),
          data_registro: new Date(),
          data_criacao: new Date(),
          data_atualizacao: new Date(),
        },
      ];

      mockLinhaDoTempoService.findAll.mockResolvedValue(linhaDoTempo);

      const result = await controller.findAll(investimento_id);

      expect(result).toEqual(linhaDoTempo);
      expect(service.findAll).toHaveBeenCalledWith(+investimento_id);
    });
  });

  describe("findOne", () => {
    it("should return a linha do tempo investimento by id", async () => {
      const investimento_id = faker.number.int().toString();
      const linha_do_tempo_id = faker.number.int().toString();

      const linhaDoTempo = {
        id: linha_do_tempo_id,
        valor: faker.number
          .float({ min: 100, max: 9999, fractionDigits: 2 })
          .toString(),
        data_registro: new Date(),
        data_criacao: new Date(),
        data_atualizacao: new Date(),
      };

      mockLinhaDoTempoService.findOne.mockResolvedValue(linhaDoTempo);

      const result = await controller.findOne(investimento_id, linha_do_tempo_id);

      expect(result).toEqual(linhaDoTempo);
      expect(service.findOne).toHaveBeenCalledWith(
        +investimento_id,
        +linha_do_tempo_id,
      );
    });

    it("should return null if linha do tempo investimento not found", async () => {
      const investimento_id = faker.number.int().toString();
      const linha_do_tempo_id = "999";

      mockLinhaDoTempoService.findOne.mockResolvedValue(null);

      const result = await controller.findOne(investimento_id, linha_do_tempo_id);

      expect(result).toBeNull();
      expect(service.findOne).toHaveBeenCalledWith(
        +investimento_id,
        +linha_do_tempo_id,
      );
    });
  });

  describe("update", () => {
    it("should update a linha do tempo investimento", async () => {
      const investimento_id = faker.number.int().toString();
      const linha_do_tempo_id = faker.number.int().toString();

      const updateLinhaDoTempoDto: RegistroInvestimentoLinhaDoTempoUpdateDto = {
        valor: "1300.00",
        data_registro: new Date(),
      };

      const updatedLinhaDoTempo = {
        id: 1,
        ...updateLinhaDoTempoDto,
        data_atualizacao: new Date(),
      };

      mockLinhaDoTempoService.update.mockResolvedValue(updatedLinhaDoTempo);

      const result = await controller.update(
        investimento_id,
        linha_do_tempo_id,
        updateLinhaDoTempoDto,
      );

      expect(result).toEqual(updatedLinhaDoTempo);
      expect(service.update).toHaveBeenCalledWith(
        +investimento_id,
        +linha_do_tempo_id,
        updateLinhaDoTempoDto,
      );
    });
  });

  describe("remove", () => {
    it("should perform a soft delete of a linha do tempo investimento", async () => {
      const investimento_id = faker.number.int().toString();
      const linha_do_tempo_id = faker.number.int().toString();

      const linhaDoTempoToDelete = {
        id: linha_do_tempo_id,
        valor: "1200.00",
        data_registro: new Date(),
      };

      mockLinhaDoTempoService.softDelete.mockResolvedValue(linhaDoTempoToDelete);

      const result = await controller.remove(investimento_id, linha_do_tempo_id);

      expect(result).toEqual(linhaDoTempoToDelete);
      expect(service.softDelete).toHaveBeenCalledWith(
        +investimento_id,
        +linha_do_tempo_id,
      );
    });
  });
});

import { Test, TestingModule } from "@nestjs/testing";
import { LinhaDoTempoInvestimentosController } from "./linha-do-tempo-investimentos.controller";
import { LinhaDoTempoInvestimentosService } from "./linha-do-tempo-investimentos.service";
import { faker } from "@faker-js/faker";
import { RegistroInvestimentoLinhaDoTempoCreateDto } from "./dtos/RegistroInvestimentoLinhaDoTempoCreate.dto";
import { RegistroInvestimentoLinhaDoTempoUpdateDto } from "./dtos/RegistroInvestimentoLinhaDoTempoUpdate.dto";
import { InvestimentosService } from "../investimentos/investimentos.service";
import { NotFoundException } from "@nestjs/common";

const mockLinhaDoTempoService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  softDelete: jest.fn(),
};

const mockInvestimentosService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  softDelete: jest.fn(),
};

describe("LinhaDoTempoInvestimentosController", () => {
  let controller: LinhaDoTempoInvestimentosController;
  let service: LinhaDoTempoInvestimentosService;
  let investimentosService: InvestimentosService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LinhaDoTempoInvestimentosController],
      providers: [
        LinhaDoTempoInvestimentosService,
        {
          provide: LinhaDoTempoInvestimentosService,
          useValue: mockLinhaDoTempoService,
        },
        {
          provide: InvestimentosService,
          useValue: mockInvestimentosService,
        },
      ],
    }).compile();

    controller = module.get<LinhaDoTempoInvestimentosController>(
      LinhaDoTempoInvestimentosController,
    );
    service = module.get<LinhaDoTempoInvestimentosService>(
      LinhaDoTempoInvestimentosService,
    );
    investimentosService =
      module.get<InvestimentosService>(InvestimentosService);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("create", () => {
    it("should create a new linha do tempo investimento", async () => {
      const investimento_id = faker.number.int().toString();

      const investimentoDto = { id: faker.number.int() };

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

      mockInvestimentosService.findOne.mockReturnValueOnce(investimentoDto);
      mockLinhaDoTempoService.create.mockResolvedValueOnce(createdLinhaDoTempo);

      const result = await controller.create(
        investimento_id,
        createLinhaDoTempoDto,
      );

      expect(result).toEqual(createdLinhaDoTempo);
      expect(service.create).toHaveBeenCalledWith(
        investimentoDto.id,
        createLinhaDoTempoDto,
      );
    });

    it("should call investimentos service", async () => {
      const investimento_id = faker.number.int().toString();

      const investimentoDto = { id: faker.number.int() };

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

      mockInvestimentosService.findOne.mockReturnValueOnce(investimentoDto);
      mockLinhaDoTempoService.create.mockResolvedValueOnce(createdLinhaDoTempo);

      await controller.create(investimento_id, createLinhaDoTempoDto);

      expect(investimentosService.findOne).toHaveBeenCalledWith(
        +investimento_id,
      );
    });

    it("should throw exception if investimentos service returns null", async () => {
      const investimento_id = faker.number.int().toString();

      const investimentoDto = null;

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

      mockInvestimentosService.findOne.mockReturnValueOnce(investimentoDto);
      mockLinhaDoTempoService.create.mockResolvedValueOnce(createdLinhaDoTempo);

      const promise = controller.create(investimento_id, createLinhaDoTempoDto);

      await expect(promise).rejects.toThrow(
        new NotFoundException("O investimento informado não foi encontrado."),
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

    it("should call investimento service with correct values", async () => {
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

      const investimentoDto = { id: faker.number.int() };

      mockInvestimentosService.findOne.mockResolvedValueOnce(investimentoDto)
      mockLinhaDoTempoService.findAll.mockResolvedValueOnce(linhaDoTempo);

      await controller.findAll(investimento_id);

      expect(investimentosService.findOne).toHaveBeenCalledWith(+investimento_id);
    });

    it("should throw exception if investimento service returns null", async () => {
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

      const investimentoDto = null;

      mockInvestimentosService.findOne.mockResolvedValueOnce(investimentoDto)
      mockLinhaDoTempoService.findAll.mockResolvedValueOnce(linhaDoTempo);

      const promise = controller.findAll(investimento_id);

      await expect(promise).rejects.toThrow(new NotFoundException('O investimento informado não foi encontrado.'));
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

      const investimentoDto = { id: faker.number.int() };

      mockInvestimentosService.findOne.mockResolvedValueOnce(investimentoDto);
      mockLinhaDoTempoService.findOne.mockResolvedValueOnce(linhaDoTempo);

      const result = await controller.findOne(
        investimento_id,
        linha_do_tempo_id,
      );

      expect(result).toEqual(linhaDoTempo);
      expect(service.findOne).toHaveBeenCalledWith(
        +investimento_id,
        +linha_do_tempo_id,
      );
    });

    it("should return null if linha do tempo investimento not found", async () => {
      const investimento_id = faker.number.int().toString();
      const linha_do_tempo_id = "999";

      const investimentoDto = { id: faker.number.int() };

      mockInvestimentosService.findOne.mockResolvedValueOnce(investimentoDto);
      mockLinhaDoTempoService.findOne.mockResolvedValue(null);

      const result = await controller.findOne(
        investimento_id,
        linha_do_tempo_id,
      );

      expect(result).toBeNull();
      expect(service.findOne).toHaveBeenCalledWith(
        +investimento_id,
        +linha_do_tempo_id,
      );
    });

    it("should throw exception if investimento service returns null", async () => {
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

      const investimentoDto = null;

      mockInvestimentosService.findOne.mockResolvedValueOnce(investimentoDto);
      mockLinhaDoTempoService.findOne.mockResolvedValue(linhaDoTempo);

      const promise = controller.findOne(
        investimento_id,
        linha_do_tempo_id,
      );

      await expect(promise).rejects.toThrow(new NotFoundException('O investimento informado não foi encontrado.'));
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

      const investimentoDto = { id: faker.number.int() };

      mockInvestimentosService.findOne.mockResolvedValueOnce(investimentoDto);
      mockLinhaDoTempoService.update.mockResolvedValueOnce(updatedLinhaDoTempo);

      const result = await controller.update(
        investimento_id,
        linha_do_tempo_id,
        updateLinhaDoTempoDto,
      );

      expect(result).toEqual(updatedLinhaDoTempo);
      expect(service.update).toHaveBeenCalledWith(
        investimentoDto.id,
        +linha_do_tempo_id,
        updateLinhaDoTempoDto,
      );
    });

    it("should call investimento service with correct values", async () => {
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

      const investimentoDto = { id: faker.number.int() };

      mockInvestimentosService.findOne.mockResolvedValueOnce(investimentoDto);
      mockLinhaDoTempoService.update.mockResolvedValueOnce(updatedLinhaDoTempo);

      await controller.update(
        investimento_id,
        linha_do_tempo_id,
        updateLinhaDoTempoDto,
      );

      expect(investimentosService.findOne).toHaveBeenCalledWith(
        +investimento_id,
      );
    });

    it("should throw exception if investimento service returns null", async () => {
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

      const investimentoDto = null;

      mockInvestimentosService.findOne.mockResolvedValueOnce(investimentoDto);
      mockLinhaDoTempoService.update.mockResolvedValueOnce(updatedLinhaDoTempo);

      const promise = controller.update(
        investimento_id,
        linha_do_tempo_id,
        updateLinhaDoTempoDto,
      );

      await expect(promise).rejects.toThrow('');
      
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

      const investimentoDto = { id: faker.number.int() };

      mockInvestimentosService.findOne.mockResolvedValueOnce(investimentoDto);
      mockLinhaDoTempoService.softDelete.mockResolvedValue(
        linhaDoTempoToDelete,
      );

      const result = await controller.remove(
        investimento_id,
        linha_do_tempo_id,
      );

      expect(result).toEqual(linhaDoTempoToDelete);
      expect(service.softDelete).toHaveBeenCalledWith(
        investimentoDto.id,
        +linha_do_tempo_id,
      );
    });

    it("should call investimento service with correct values", async () => {
      const investimento_id = faker.number.int().toString();
      const linha_do_tempo_id = faker.number.int().toString();

      const linhaDoTempoToDelete = {
        id: linha_do_tempo_id,
        valor: "1200.00",
        data_registro: new Date(),
      };

      const investimentoDto = { id: faker.number.int() };

      mockInvestimentosService.findOne.mockResolvedValueOnce(investimentoDto);
      mockLinhaDoTempoService.softDelete.mockResolvedValue(
        linhaDoTempoToDelete,
      );

      await controller.remove(
        investimento_id,
        linha_do_tempo_id,
      );

      expect(investimentosService.findOne).toHaveBeenCalledWith(
        +investimento_id,
        
      );
    });

    it("should throw exception if investimento service returns null", async () => {
      const investimento_id = faker.number.int().toString();
      const linha_do_tempo_id = faker.number.int().toString();

      const linhaDoTempoToDelete = {
        id: linha_do_tempo_id,
        valor: "1200.00",
        data_registro: new Date(),
      };

      const investimentoDto = null;

      mockInvestimentosService.findOne.mockResolvedValueOnce(investimentoDto);
      mockLinhaDoTempoService.softDelete.mockResolvedValue(
        linhaDoTempoToDelete,
      );

      const promise = controller.remove(
        investimento_id,
        linha_do_tempo_id,
      );

      await expect(promise).rejects.toThrow(new NotFoundException('O investimento informado não foi encontrado.'));
    });
  });
});

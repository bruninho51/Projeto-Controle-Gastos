import { Test, TestingModule } from "@nestjs/testing";
import { LinhaDoTempoInvestimentosService } from "./linha-do-tempo-investimentos.service";
import { PrismaService } from "../../../../src/modules/prisma/prisma.service";
import { faker } from "@faker-js/faker";
import { RegistroInvestimentoLinhaDoTempoCreateDto } from "./dtos/RegistroInvestimentoLinhaDoTempoCreate.dto";
import { RegistroInvestimentoLinhaDoTempoUpdateDto } from "./dtos/RegistroInvestimentoLinhaDoTempoUpdate.dto";

const mockPrismaService = {
  linhaDoTempoInvestimento: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
};

describe("LinhaDoTempoInvestimentosService", () => {
  let service: LinhaDoTempoInvestimentosService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LinhaDoTempoInvestimentosService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<LinhaDoTempoInvestimentosService>(
      LinhaDoTempoInvestimentosService,
    );
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("create", () => {
    it("should create a new linha do tempo investimento", async () => {
      const investimento_id = faker.number.int();
      const linha_do_tempo_id = faker.number.int();

      const createLinhaDoTempoDto: RegistroInvestimentoLinhaDoTempoCreateDto = {
        valor: faker.number
          .float({ min: 100, max: 9999, fractionDigits: 2 })
          .toString(),
        data_registro: new Date(),
      };

      const createdLinhaDoTempo = {
        id: linha_do_tempo_id,
        ...createLinhaDoTempoDto,
        investimento_id,
        data_criacao: new Date(),
        data_atualizacao: new Date(),
      };

      mockPrismaService.linhaDoTempoInvestimento.create.mockResolvedValue(
        createdLinhaDoTempo,
      );

      const result = await service.create(
        investimento_id,
        createLinhaDoTempoDto,
      );

      expect(result).toEqual(createdLinhaDoTempo);
      expect(
        mockPrismaService.linhaDoTempoInvestimento.create,
      ).toHaveBeenCalledWith({
        data: { ...createLinhaDoTempoDto, investimento_id },
      });
    });
  });

  describe("findAll", () => {
    it("should return an array of linha do tempo investimento", async () => {
      const investimento_id = faker.number.int();

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

      mockPrismaService.linhaDoTempoInvestimento.findMany.mockResolvedValue(
        linhaDoTempo,
      );

      const result = await service.findAll(investimento_id);

      expect(result).toEqual(linhaDoTempo);
      expect(
        mockPrismaService.linhaDoTempoInvestimento.findMany,
      ).toHaveBeenCalledWith({
        where: { investimento_id, soft_delete: null },
      });
    });
  });

  describe("findOne", () => {
    it("should return a single linha do tempo investimento by id", async () => {
      const investimento_id = faker.number.int();
      const linha_do_tempo_id = faker.number.int();

      const linhaDoTempo = {
        id: linha_do_tempo_id,
        valor: faker.number
          .float({ min: 100, max: 9999, fractionDigits: 2 })
          .toString(),
        data_registro: new Date(),
        data_criacao: new Date(),
        data_atualizacao: new Date(),
      };

      mockPrismaService.linhaDoTempoInvestimento.findUnique.mockResolvedValue(
        linhaDoTempo,
      );

      const result = await service.findOne(investimento_id, linha_do_tempo_id);

      expect(result).toEqual(linhaDoTempo);
      expect(
        mockPrismaService.linhaDoTempoInvestimento.findUnique,
      ).toHaveBeenCalledWith({
        where: { id: linha_do_tempo_id, investimento_id, soft_delete: null },
      });
    });

    it("should return null if linha do tempo investimento not found", async () => {
      const investimento_id = faker.number.int();
      const linha_do_tempo_id = 999;

      mockPrismaService.linhaDoTempoInvestimento.findUnique.mockResolvedValue(
        null,
      );

      const result = await service.findOne(investimento_id, linha_do_tempo_id);

      expect(result).toBeNull();
      expect(
        mockPrismaService.linhaDoTempoInvestimento.findUnique,
      ).toHaveBeenCalledWith({
        where: { id: 999, investimento_id, soft_delete: null },
      });
    });
  });

  describe("update", () => {
    it("should update a linha do tempo investimento", async () => {
      const investimento_id = faker.number.int();
      const linha_do_tempo_id = faker.number.int();

      const updateLinhaDoTempoDto: RegistroInvestimentoLinhaDoTempoUpdateDto = {
        valor: "1500.00",
        data_registro: new Date(),
      };

      const updatedLinhaDoTempo = {
        id: linha_do_tempo_id,
        ...updateLinhaDoTempoDto,
        data_criacao: new Date(),
        data_atualizacao: new Date(),
      };

      mockPrismaService.linhaDoTempoInvestimento.update.mockResolvedValue(
        updatedLinhaDoTempo,
      );

      const result = await service.update(
        investimento_id,
        linha_do_tempo_id,
        updateLinhaDoTempoDto,
      );

      expect(result).toEqual(updatedLinhaDoTempo);
      expect(
        mockPrismaService.linhaDoTempoInvestimento.update,
      ).toHaveBeenCalledWith({
        where: { id: linha_do_tempo_id, investimento_id, soft_delete: null },
        data: updateLinhaDoTempoDto,
      });
    });
  });

  describe("softDelete", () => {
    it("should perform a soft delete of a linha do tempo investimento", async () => {
      const investimento_id = faker.number.int();
      const linha_do_tempo_id = faker.number.int();

      const linhaDoTempoToDelete = {
        id: linha_do_tempo_id,
        valor: "1000.00",
        data_registro: new Date(),
      };

      const softDeletedLinhaDoTempo = {
        ...linhaDoTempoToDelete,
        soft_delete: new Date(),
      };

      mockPrismaService.linhaDoTempoInvestimento.update.mockResolvedValue(
        softDeletedLinhaDoTempo,
      );

      const result = await service.softDelete(
        investimento_id,
        linha_do_tempo_id,
      );

      expect(result).toEqual(softDeletedLinhaDoTempo);
      expect(
        mockPrismaService.linhaDoTempoInvestimento.update,
      ).toHaveBeenCalledWith({
        where: { id: linha_do_tempo_id, investimento_id, soft_delete: null },
        data: { soft_delete: expect.any(Date) },
      });
    });
  });
});

import { Test, TestingModule } from "@nestjs/testing";
import { OrcamentosService } from "./orcamentos.service";
import { PrismaService } from "../../prisma/prisma.service";
import { OrcamentoCreateDto } from "./dtos/OrcamentoCreate.dto";
import { OrcamentoUpdateDto } from "./dtos/OrcamentoUpdate.dto";
import { faker } from "@faker-js/faker";

const mockPrismaService = {
  orcamento: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

describe("OrcamentosService", () => {
  let service: OrcamentosService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrcamentosService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<OrcamentosService>(OrcamentosService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("create", () => {
    it("should create a new orcamento", async () => {
      const createOrcamentoDto: OrcamentoCreateDto = {
        nome: "Orçamento A",
        valor_inicial: "1000.00",
      };

      const createdOrcamento = {
        id: 1,
        ...createOrcamentoDto,
        data_criacao: new Date(),
        data_atualizacao: new Date(),
      };

      const usuarioId = faker.number.int();

      mockPrismaService.orcamento.create.mockResolvedValue(createdOrcamento);

      const result = await service.create(usuarioId, createOrcamentoDto);

      expect(result).toEqual(createdOrcamento);
      expect(mockPrismaService.orcamento.create).toHaveBeenCalledWith({
        data: { ...createOrcamentoDto, usuario_id: usuarioId },
      });
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

      mockPrismaService.orcamento.findMany.mockResolvedValue(orcamentos);

      const usuarioId = faker.number.int();

      const result = await service.findAll(usuarioId);

      expect(result).toEqual(orcamentos);
      expect(mockPrismaService.orcamento.findMany).toHaveBeenCalledWith({
        where: { usuario_id: usuarioId, soft_delete: null },
      });
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
        data_encerramento: new Date("2024-12-31"),
        data_criacao: new Date(),
        data_atualizacao: new Date(),
      };

      mockPrismaService.orcamento.findUnique.mockResolvedValue(orcamento);

      const usuarioId = faker.number.int();

      const result = await service.findOne(usuarioId, 1);

      expect(result).toEqual(orcamento);
      expect(mockPrismaService.orcamento.findUnique).toHaveBeenCalledWith({
        where: { id: 1, usuario_id: usuarioId, soft_delete: null },
      });
    });

    it("should return null if orcamento not found", async () => {
      mockPrismaService.orcamento.findUnique.mockResolvedValue(null);

      const usuarioId = faker.number.int();

      const result = await service.findOne(usuarioId, 999);

      expect(result).toBeNull();
      expect(mockPrismaService.orcamento.findUnique).toHaveBeenCalledWith({
        where: { id: 999, usuario_id: usuarioId, soft_delete: null },
      });
    });
  });

  describe("update", () => {
    it("should update an orcamento", async () => {
      const updateOrcamentoDto: OrcamentoUpdateDto = {
        nome: "Orçamento A Atualizado",
        valor_inicial: "1300.00",
      };

      const updatedOrcamento = {
        id: 1,
        nome: "Orçamento A Atualizado",
        valor_inicial: "1300.00",
        valor_atual: "1300.00",
        valor_livre: "1300.00",
        data_encerramento: null,
        data_criacao: new Date(),
        data_atualizacao: new Date(),
      };

      mockPrismaService.orcamento.update.mockResolvedValue(updatedOrcamento);

      const usuarioId = faker.number.int();

      const result = await service.update(usuarioId, 1, updateOrcamentoDto);

      expect(result).toEqual(updatedOrcamento);
      expect(mockPrismaService.orcamento.update).toHaveBeenCalledWith({
        where: { id: 1, usuario_id: usuarioId, soft_delete: null },
        data: updateOrcamentoDto,
      });
    });
  });

  describe("softDelete", () => {
    it("should perform a soft delete of an orcamento", async () => {
      const orcamentoToDelete = {
        id: 1,
        nome: "Orçamento A",
        valor_inicial: "1000.00",
        valor_atual: "1200.00",
        valor_livre: "200.00",
      };

      const softDeletedOrcamento = {
        ...orcamentoToDelete,
        soft_delete: new Date(),
      };

      mockPrismaService.orcamento.update.mockResolvedValue(
        softDeletedOrcamento,
      );

      const usuarioId = faker.number.int();

      const result = await service.softDelete(usuarioId, 1);

      expect(result).toEqual(softDeletedOrcamento);
      expect(mockPrismaService.orcamento.update).toHaveBeenCalledWith({
        where: { id: 1, usuario_id: usuarioId, soft_delete: null },
        data: { soft_delete: expect.any(Date) },
      });
    });
  });
});

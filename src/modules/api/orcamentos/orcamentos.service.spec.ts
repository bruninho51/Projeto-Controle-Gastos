import { Test, TestingModule } from "@nestjs/testing";
import { OrcamentosService } from "./orcamentos.service";
import { PrismaService } from "../../prisma/prisma.service";
import { OrcamentoCreateDto } from "./dtos/OrcamentoCreate.dto";
import { OrcamentoUpdateDto } from "./dtos/OrcamentoUpdate.dto";
import { faker } from "@faker-js/faker";
import { Orcamento, Prisma } from "@prisma/client";
import { OrcamentoResponseDto } from "./dtos/OrcamentoResponse.dto";
import { OrcamentoFindDto } from "./dtos/OrcamentoFind.dto";

function buildOrcamento(overrides: Partial<Orcamento> = {}): Orcamento {
  return {
    id: faker.number.int(),
    nome: faker.string.alphanumeric(5),
    valor_inicial: Prisma.Decimal("1000.00"),
    valor_atual: Prisma.Decimal("1000.00"),
    valor_livre: Prisma.Decimal("1000.00"),
    usuario_id: faker.number.int(),
    data_encerramento: null,
    soft_delete: null,
    data_criacao: new Date(),
    data_atualizacao: new Date(),
    data_inatividade: null,
    ...overrides,
  };
}

function toResponseDto(orcamento: Orcamento): OrcamentoResponseDto {
  const dto = new OrcamentoResponseDto({});

  dto.id = orcamento.id;
  dto.nome = orcamento.nome;
  dto.valor_inicial = orcamento.valor_inicial.toString();
  dto.valor_atual = orcamento.valor_atual.toString();
  dto.valor_livre = orcamento.valor_livre.toString();
  dto.data_encerramento = orcamento.data_encerramento;
  dto.data_criacao = orcamento.data_criacao;
  dto.data_atualizacao = orcamento.data_atualizacao;
  dto.data_inatividade = orcamento.data_inatividade;

  return dto;
}

let mockPrismaService: {
  orcamento: {
    create: jest.Mock;
    findMany: jest.Mock;
    findUnique: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };
};

function createPrismaMock() {
  return {
    orcamento: {
      create: jest.fn().mockResolvedValue(null),
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn().mockResolvedValue(null),
      update: jest.fn().mockResolvedValue(null),
      delete: jest.fn().mockResolvedValue(null),
    },
  };
}

describe("OrcamentosService", () => {
  let service: OrcamentosService;

  beforeEach(async () => {
    jest.clearAllMocks();

    mockPrismaService = createPrismaMock();

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
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("create", () => {
    it("should create a new orcamento", async () => {
      const usuarioId = faker.number.int();

      const createOrcamentoDto: OrcamentoCreateDto = {
        nome: "Orçamento A",
        valor_inicial: "1000.00",
      };

      const createdOrcamento = buildOrcamento({
        nome: createOrcamentoDto.nome,
        valor_inicial: Prisma.Decimal(createOrcamentoDto.valor_inicial),
        usuario_id: usuarioId,
      });

      mockPrismaService.orcamento.create.mockResolvedValue(createdOrcamento);

      const result = await service.create(usuarioId, createOrcamentoDto);

      expect(result).toStrictEqual(toResponseDto(createdOrcamento));
      expect(mockPrismaService.orcamento.create).toHaveBeenCalledWith({
        data: { ...createOrcamentoDto, usuario_id: usuarioId },
      });
    });
  });

  describe("findAll", () => {
    const BASE_WHERE = Object.freeze({
      usuario_id: 1,
      soft_delete: null,
    });

    function getLastFindManyWhere() {
      const calls = mockPrismaService.orcamento.findMany.mock.calls;
      if (!calls.length) throw new Error("findMany não foi chamado");
      return calls[calls.length - 1][0].where;
    }

    async function findAllWhere(filters: OrcamentoFindDto) {
      await service.findAll(1, filters);
      return getLastFindManyWhere();
    }

    it("should return an array of orcamentos", async () => {
      const usuarioId = faker.number.int();

      const orcamentos = [
        buildOrcamento({ id: 1, nome: "Orçamento A", usuario_id: usuarioId }),
        buildOrcamento({ id: 2, nome: "Orçamento B", usuario_id: usuarioId }),
      ];

      mockPrismaService.orcamento.findMany.mockResolvedValue(orcamentos);

      const result = await service.findAll(usuarioId, {});

      expect(result).toStrictEqual(orcamentos.map(toResponseDto));
      expect(mockPrismaService.orcamento.findMany).toHaveBeenCalledWith({
        where: { usuario_id: usuarioId, soft_delete: null },
      });
    });

    it("should filter by nome", async () => {
      const nome = faker.string.alpha(8);
      expect(await findAllWhere({ nome })).toStrictEqual({
        ...BASE_WHERE,
        nome: { contains: nome },
      });
    });

    it("should filter encerrado true", async () => {
      expect(await findAllWhere({ encerrado: true })).toStrictEqual({
        ...BASE_WHERE,
        data_encerramento: { not: null },
      });
    });

    it("should filter encerrado false", async () => {
      expect(await findAllWhere({ encerrado: false })).toStrictEqual({
        ...BASE_WHERE,
        data_encerramento: null,
      });
    });

    it("should filter inativo true", async () => {
      expect(await findAllWhere({ inativo: true })).toStrictEqual({
        ...BASE_WHERE,
        data_inatividade: { not: null },
      });
    });

    it("should filter inativo false", async () => {
      expect(await findAllWhere({ inativo: false })).toStrictEqual({
        ...BASE_WHERE,
        data_inatividade: null,
      });
    });

    it("should apply all filters together", async () => {
      const nome = faker.string.alpha(8);
      expect(
        await findAllWhere({ nome, encerrado: true, inativo: false }),
      ).toStrictEqual({
        ...BASE_WHERE,
        nome: { contains: nome },
        data_encerramento: { not: null },
        data_inatividade: null,
      });
    });

    it("should not add extra operators when no filters", async () => {
      expect(await findAllWhere({})).toStrictEqual(BASE_WHERE);
    });
  });

  describe("findOne", () => {
    it("should return a single orcamento by id", async () => {
      const usuarioId = faker.number.int();
      const orcamentoId = faker.number.int();

      const orcamento = buildOrcamento({
        id: orcamentoId,
        usuario_id: usuarioId,
        data_encerramento: new Date("2024-12-31"),
      });

      mockPrismaService.orcamento.findUnique.mockResolvedValue(orcamento);

      const result = await service.findOne(usuarioId, orcamentoId);

      expect(result).toStrictEqual(toResponseDto(orcamento));
      expect(mockPrismaService.orcamento.findUnique).toHaveBeenCalledWith({
        where: { id: orcamentoId, usuario_id: usuarioId, soft_delete: null },
      });
    });

    it("should return null if orcamento not found", async () => {
      const usuarioId = faker.number.int();

      mockPrismaService.orcamento.findUnique.mockResolvedValue(null);

      const result = await service.findOne(usuarioId, 999);

      expect(result).toBeNull();
      expect(mockPrismaService.orcamento.findUnique).toHaveBeenCalledWith({
        where: { id: 999, usuario_id: usuarioId, soft_delete: null },
      });
    });
  });

  describe("update", () => {
    it("should update an orcamento", async () => {
      const usuarioId = faker.number.int();
      const orcamentoId = faker.number.int();

      const updateOrcamentoDto: OrcamentoUpdateDto = {
        nome: "Orçamento A Atualizado",
        valor_inicial: "1300.00",
      };

      const updatedOrcamento = buildOrcamento({
        id: orcamentoId,
        usuario_id: usuarioId,
        nome: updateOrcamentoDto.nome,
        valor_inicial: Prisma.Decimal(updateOrcamentoDto.valor_inicial),
      });

      mockPrismaService.orcamento.update.mockResolvedValue(updatedOrcamento);

      const result = await service.update(
        usuarioId,
        orcamentoId,
        updateOrcamentoDto,
      );

      expect(result).toStrictEqual(toResponseDto(updatedOrcamento));
      expect(mockPrismaService.orcamento.update).toHaveBeenCalledWith({
        where: { id: orcamentoId, usuario_id: usuarioId, soft_delete: null },
        data: updateOrcamentoDto,
      });
    });
  });

  describe("softDelete", () => {
    it("should perform a soft delete of an orcamento", async () => {
      const usuarioId = faker.number.int();
      const orcamentoId = faker.number.int();

      const softDeletedOrcamento = buildOrcamento({
        id: orcamentoId,
        usuario_id: usuarioId,
        soft_delete: new Date(),
      });

      mockPrismaService.orcamento.update.mockResolvedValue(
        softDeletedOrcamento,
      );

      const result = await service.softDelete(usuarioId, orcamentoId);

      expect(result).toStrictEqual(toResponseDto(softDeletedOrcamento));
      expect(mockPrismaService.orcamento.update).toHaveBeenCalledWith({
        where: { id: orcamentoId, usuario_id: usuarioId, soft_delete: null },
        data: { soft_delete: expect.any(Date) },
      });
    });
  });
});

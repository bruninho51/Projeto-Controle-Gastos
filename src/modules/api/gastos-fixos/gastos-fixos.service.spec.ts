import { Test, TestingModule } from "@nestjs/testing";
import { GastosFixosService } from "./gastos-fixos.service";
import { PrismaService } from "../../prisma/prisma.service";
import { GastoFixoCreateDto } from "./dtos/GastoFixoCreate.dto";
import { GastoFixoUpdateDto } from "./dtos/GastoFixoUpdate.dto";
import { faker } from "@faker-js/faker";
import { GastoFixoFindDto, StatusGasto } from "./dtos/GastoFixoFind.dto";
import { CategoriaGasto, GastoFixo, Prisma } from "@prisma/client";
import { GastoFixoResponseDto } from "./dtos/GastoFixoResponse.dto";
import { CategoriaGastoResponseDto } from "../categorias-gastos/dtos/CategoriaGastoResponse.dto";

type GastoFixoWithCategoria = GastoFixo & { categoriaGasto: CategoriaGasto };

function buildCategoriaGasto(
  overrides: Partial<CategoriaGasto> = {},
): CategoriaGasto {
  return {
    id: faker.number.int(),
    nome: "Categoria Teste",
    data_criacao: new Date(),
    data_atualizacao: new Date(),
    data_inatividade: null,
    usuario_id: faker.number.int(),
    soft_delete: null,
    ...overrides,
  };
}

function buildGastoFixo(
  overrides: Partial<GastoFixoWithCategoria> = {},
): GastoFixoWithCategoria {
  const categoriaGasto = overrides.categoriaGasto ?? buildCategoriaGasto();
  return {
    id: faker.number.int(),
    descricao: faker.string.alphanumeric(5),
    previsto: new Prisma.Decimal(
      faker.number.float({ min: 100, max: 9999, fractionDigits: 2 }).toString(),
    ),
    valor: null,
    diferenca: null,
    categoria_id: categoriaGasto.id,
    orcamento_id: faker.number.int(),
    data_venc: faker.date.future(),
    data_pgto: null,
    soft_delete: null,
    data_criacao: new Date(),
    data_atualizacao: new Date(),
    data_inatividade: null,
    observacoes: null,
    ...overrides,
    categoriaGasto,
  };
}

function toResponseDto(
  gastoFixo: GastoFixoWithCategoria,
): GastoFixoResponseDto {
  const { categoriaGasto } = gastoFixo;

  const dto = new GastoFixoResponseDto({});

  dto.id = gastoFixo.id;
  dto.descricao = gastoFixo.descricao;
  dto.previsto = gastoFixo.previsto ? gastoFixo.previsto.toString() : null;
  dto.valor = gastoFixo.valor ? gastoFixo.valor.toString() : null;
  dto.diferenca = gastoFixo.diferenca ? gastoFixo.diferenca.toString() : null;
  dto.categoria_id = gastoFixo.categoria_id;
  dto.orcamento_id = gastoFixo.orcamento_id;
  dto.data_venc = gastoFixo.data_venc;
  dto.data_pgto = gastoFixo.data_pgto;
  dto.observacoes = gastoFixo.observacoes;
  dto.data_criacao = gastoFixo.data_criacao;
  dto.data_atualizacao = gastoFixo.data_atualizacao;
  dto.data_inatividade = gastoFixo.data_inatividade;

  // Transformação para CategoriaGastoResponseDto
  const categoriaDto = new CategoriaGastoResponseDto({});
  categoriaDto.id = categoriaGasto.id;
  categoriaDto.nome = categoriaGasto.nome;
  categoriaDto.data_criacao = categoriaGasto.data_criacao;
  categoriaDto.data_atualizacao = categoriaGasto.data_atualizacao;
  categoriaDto.data_inatividade = categoriaGasto.data_inatividade;

  dto.categoriaGasto = categoriaDto;

  return dto;
}

let mockPrismaService: {
  gastoFixo: {
    create: jest.Mock;
    findMany: jest.Mock;
    findUnique: jest.Mock;
    update: jest.Mock;
  };
};

function createPrismaMock() {
  return {
    gastoFixo: {
      create: jest.fn().mockResolvedValue(null), // create normalmente retorna o objeto criado, mas null como padrão
      findMany: jest.fn().mockResolvedValue([]), // findMany sempre retorna array
      findUnique: jest.fn().mockResolvedValue(null), // findUnique pode retornar null
      update: jest.fn().mockResolvedValue(null), // update pode retornar null se nada for encontrado
    },
  };
}

describe("GastosFixosService", () => {
  let service: GastosFixosService;

  beforeEach(async () => {
    jest.clearAllMocks();

    mockPrismaService = createPrismaMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GastosFixosService,
        { provide: PrismaService, useValue: mockPrismaService },
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

      const createGastoDto: GastoFixoCreateDto = {
        descricao: faker.string.alphanumeric(5),
        observacoes: faker.string.alphanumeric(5),
        categoria_id: faker.number.int(),
        data_venc: faker.date.future(),
        previsto: faker.number
          .float({ min: 100, max: 9999, fractionDigits: 2 })
          .toString(),
      };

      const createdGastoFixo = buildGastoFixo({
        descricao: createGastoDto.descricao,
        previsto: new Prisma.Decimal(createGastoDto.previsto),
        categoria_id: createGastoDto.categoria_id,
        orcamento_id,
        data_venc: createGastoDto.data_venc,
      });

      mockPrismaService.gastoFixo.create.mockResolvedValue(createdGastoFixo);

      const result = await service.create(orcamento_id, createGastoDto);

      expect(result).toStrictEqual(toResponseDto(createdGastoFixo));
      expect(mockPrismaService.gastoFixo.create).toHaveBeenCalledWith({
        include: { categoriaGasto: true },
        data: { ...createGastoDto, orcamento_id },
      });
    });
  });

  describe("findAll", () => {
    const BASE_WHERE = Object.freeze({
      orcamento_id: 1,
      soft_delete: null,
    });

    function getLastFindManyWhere() {
      const calls = mockPrismaService.gastoFixo.findMany.mock.calls;
      if (!calls.length) throw new Error("findMany não foi chamado");
      return calls[calls.length - 1][0].where;
    }

    async function findAllWhere(filters: GastoFixoFindDto) {
      await service.findAll(1, filters);
      return getLastFindManyWhere();
    }

    it("should return an array of gasto fixo", async () => {
      const orcamento_id = faker.number.int();

      const gastosFixos = [
        buildGastoFixo({
          id: 1,
          descricao: "Gasto Fixo A",
          previsto: new Prisma.Decimal("1000.00"),
          observacoes: "Descrição A",
          categoria_id: 1,
          orcamento_id,
          categoriaGasto: buildCategoriaGasto({
            id: 1,
            nome: "Categoria A",
            usuario_id: 1,
          }),
        }),
        buildGastoFixo({
          id: 2,
          descricao: "Gasto Fixo B",
          previsto: new Prisma.Decimal("500.00"),
          observacoes: "Descrição B",
          categoria_id: 2,
          orcamento_id,
          categoriaGasto: buildCategoriaGasto({
            id: 2,
            nome: "Categoria B",
            usuario_id: 2,
          }),
        }),
      ];

      mockPrismaService.gastoFixo.findMany.mockResolvedValue(gastosFixos);

      const result = await service.findAll(orcamento_id, {});

      expect(result).toStrictEqual(gastosFixos.map(toResponseDto));
      expect(mockPrismaService.gastoFixo.findMany).toHaveBeenCalledWith({
        include: { categoriaGasto: true },
        where: { orcamento_id, soft_delete: null },
      });
    });

    it("should filter by descricao", async () => {
      const searchedValue = faker.string.alpha();
      expect(await findAllWhere({ descricao: searchedValue })).toStrictEqual({
        ...BASE_WHERE,
        descricao: { contains: searchedValue },
      });
    });

    it("should filter by status PAGO", async () => {
      expect(await findAllWhere({ status: StatusGasto.PAGO })).toStrictEqual({
        ...BASE_WHERE,
        data_pgto: { not: null },
      });
    });

    it("should filter by status NAO_PAGO", async () => {
      expect(
        await findAllWhere({ status: StatusGasto.NAO_PAGO }),
      ).toStrictEqual({
        ...BASE_WHERE,
        data_pgto: { equals: null },
      });
    });

    it("should filter by data_pgto day", async () => {
      const date = new Date("2026-02-10");
      expect(await findAllWhere({ data_pgto: date })).toStrictEqual({
        ...BASE_WHERE,
        data_pgto: { equals: date },
      });
    });

    it("should filter by data_pgto range", async () => {
      const inicio = new Date("2026-02-01");
      const fim = new Date("2026-02-10");
      expect(
        await findAllWhere({ data_pgto_inicio: inicio, data_pgto_fim: fim }),
      ).toStrictEqual({
        ...BASE_WHERE,
        data_pgto: { gte: inicio, lte: fim },
      });
    });

    it("should filter vencido true", async () => {
      expect(await findAllWhere({ vencido: true })).toStrictEqual({
        ...BASE_WHERE,
        AND: [{ data_pgto: null }, { data_venc: { lt: expect.any(Date) } }],
      });
    });

    it("should filter vencido false", async () => {
      expect(await findAllWhere({ vencido: false })).toStrictEqual({
        ...BASE_WHERE,
        NOT: {
          AND: [{ data_pgto: null }, { data_venc: { lt: expect.any(Date) } }],
        },
      });
    });

    it("should filter by nome_categoria", async () => {
      const nome = faker.string.alpha(10);
      expect(await findAllWhere({ nome_categoria: nome })).toStrictEqual({
        ...BASE_WHERE,
        categoriaGasto: { nome: { contains: nome } },
      });
    });

    it("should apply all filters together PAGO e NAO VENCIDO", async () => {
      const descricao = faker.string.alpha(10);
      const nome_categoria = faker.string.alpha(10);
      const inicio = new Date("2026-02-01");
      const fim = new Date("2026-02-10");

      expect(
        await findAllWhere({
          descricao,
          status: StatusGasto.PAGO,
          data_pgto_inicio: inicio,
          data_pgto_fim: fim,
          vencido: false,
          nome_categoria,
        }),
      ).toStrictEqual({
        ...BASE_WHERE,
        descricao: { contains: descricao },
        categoriaGasto: { nome: { contains: nome_categoria } },
        data_pgto: { not: null, gte: inicio, lte: fim },
        NOT: {
          AND: [{ data_pgto: null }, { data_venc: { lt: expect.any(Date) } }],
        },
      });
    });

    it("should apply all filters together NAO_PAGO e VENCIDO", async () => {
      const descricao = faker.string.alpha(10);
      const nome_categoria = faker.string.alpha(10);
      const inicio = new Date("2026-02-01");
      const fim = new Date("2026-02-10");

      expect(
        await findAllWhere({
          descricao,
          status: StatusGasto.NAO_PAGO,
          data_pgto_inicio: inicio,
          data_pgto_fim: fim,
          vencido: true,
          nome_categoria,
        }),
      ).toStrictEqual({
        ...BASE_WHERE,
        descricao: { contains: descricao },
        categoriaGasto: { nome: { contains: nome_categoria } },
        data_pgto: { equals: null, gte: inicio, lte: fim },
        AND: [{ data_pgto: null }, { data_venc: { lt: expect.any(Date) } }],
      });
    });

    it("should not add extra operators when no filters", async () => {
      expect(await findAllWhere({})).toStrictEqual(BASE_WHERE);
    });
  });

  describe("findOne", () => {
    it("should return a single gasto fixo by id", async () => {
      const orcamento_id = faker.number.int();
      const gasto_fixo_id = faker.number.int();
      const gastoFixo = buildGastoFixo({ orcamento_id });

      mockPrismaService.gastoFixo.findUnique.mockResolvedValue(gastoFixo);

      const result = await service.findOne(orcamento_id, gasto_fixo_id);

      expect(result).toStrictEqual(toResponseDto(gastoFixo));
      expect(mockPrismaService.gastoFixo.findUnique).toHaveBeenCalledWith({
        include: { categoriaGasto: true },
        where: { id: gasto_fixo_id, orcamento_id, soft_delete: null },
      });
    });

    it("should return null if gasto fixo not found", async () => {
      mockPrismaService.gastoFixo.findUnique.mockResolvedValue(null);

      const result = await service.findOne(faker.number.int(), 999);

      expect(result).toBeNull();
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

      const updatedGastoFixo = buildGastoFixo({ orcamento_id });

      mockPrismaService.gastoFixo.update.mockResolvedValue(updatedGastoFixo);

      const result = await service.update(
        orcamento_id,
        gasto_fixo_id,
        updateGastoDto,
      );

      expect(result).toStrictEqual(toResponseDto(updatedGastoFixo));
      expect(mockPrismaService.gastoFixo.update).toHaveBeenCalledWith({
        include: { categoriaGasto: true },
        where: { id: gasto_fixo_id, orcamento_id, soft_delete: null },
        data: updateGastoDto,
      });
    });
  });

  describe("softDelete", () => {
    it("should perform a soft delete of a gasto fixo", async () => {
      const orcamento_id = faker.number.int();
      const gasto_fixo_id = faker.number.int();

      const softDeletedGastoFixo = buildGastoFixo({
        orcamento_id,
        soft_delete: new Date(),
      });

      mockPrismaService.gastoFixo.update.mockResolvedValue(
        softDeletedGastoFixo,
      );

      const result = await service.softDelete(orcamento_id, gasto_fixo_id);

      expect(result).toStrictEqual(toResponseDto(softDeletedGastoFixo));
      expect(mockPrismaService.gastoFixo.update).toHaveBeenCalledWith({
        include: { categoriaGasto: true },
        where: { id: gasto_fixo_id, orcamento_id, soft_delete: null },
        data: { soft_delete: expect.any(Date) },
      });
    });
  });
});

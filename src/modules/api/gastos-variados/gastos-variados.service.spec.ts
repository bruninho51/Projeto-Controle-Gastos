import { Test, TestingModule } from "@nestjs/testing";
import { GastosVariadosService } from "./gastos-variados.service";
import { PrismaService } from "../../prisma/prisma.service";
import { GastoVariadoCreateDto } from "./dtos/GastoVariadoCreate.dto";
import { GastoVariadoUpdateDto } from "./dtos/GastoVariadoUpdate.dto";
import { faker } from "@faker-js/faker";
import { GastoVariadoFindDto } from "./dtos/GastoVariadoFind.dto";
import { CategoriaGasto, GastoVariado, Prisma } from "@prisma/client";
import { CategoriaGastoResponseDto } from "../categorias-gastos/dtos/CategoriaGastoResponse.dto";
import { GastoVariadoResponseDto } from "./dtos/GastoVariadoResponse.dto";

type GastoVariadoWithCategoria = GastoVariado & { categoriaGasto: CategoriaGasto };

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

function buildGastoVariado(
  overrides: Partial<GastoVariadoWithCategoria> = {},
): GastoVariadoWithCategoria {
  const categoriaGasto = overrides.categoriaGasto ?? buildCategoriaGasto();
  return {
    id: faker.number.int(),
    descricao: faker.string.alphanumeric(5),
    valor: new Prisma.Decimal(
      faker.number.float({ min: 100, max: 9999, fractionDigits: 2 }).toString(),
    ),
    categoria_id: categoriaGasto.id,
    orcamento_id: faker.number.int(),
    data_pgto: new Date(),
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
  gastoVariado: GastoVariadoWithCategoria,
): GastoVariadoResponseDto {
  const { categoriaGasto } = gastoVariado;

  const dto = new GastoVariadoResponseDto({});

  dto.id = gastoVariado.id;
  dto.descricao = gastoVariado.descricao;
  dto.valor = gastoVariado.valor ? gastoVariado.valor.toString() : null;
  dto.categoria_id = gastoVariado.categoria_id;
  dto.orcamento_id = gastoVariado.orcamento_id;
  dto.data_pgto = gastoVariado.data_pgto;
  dto.observacoes = gastoVariado.observacoes;
  dto.data_criacao = gastoVariado.data_criacao;
  dto.data_atualizacao = gastoVariado.data_atualizacao;
  dto.data_inatividade = gastoVariado.data_inatividade;

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
  gastoVariado: {
    create: jest.Mock;
    findMany: jest.Mock;
    findUnique: jest.Mock;
    update: jest.Mock;
  };
};

function createPrismaMock() {
  return {
    gastoVariado: {
      create: jest.fn().mockResolvedValue(null),
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn().mockResolvedValue(null),
      update: jest.fn().mockResolvedValue(null),
    },
  };
}

describe("GastosVariadosService", () => {
  let service: GastosVariadosService;

  beforeEach(async () => {
    jest.clearAllMocks();

    mockPrismaService = createPrismaMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GastosVariadosService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<GastosVariadosService>(GastosVariadosService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("create", () => {
    it("should create a new gasto variado", async () => {
      const orcamento_id = faker.number.int();

      const createGastoDto: GastoVariadoCreateDto = {
        descricao: faker.string.alphanumeric(5),
        observacoes: faker.string.alphanumeric(5),
        categoria_id: faker.number.int(),
        valor: faker.number
          .float({ min: 100, max: 9999, fractionDigits: 2 })
          .toString(),
        data_pgto: new Date(),
      };

      const createdGastoVariado = buildGastoVariado({
        descricao: createGastoDto.descricao,
        valor: new Prisma.Decimal(createGastoDto.valor),
        categoria_id: createGastoDto.categoria_id,
        orcamento_id,
        data_pgto: createGastoDto.data_pgto,
      });

      mockPrismaService.gastoVariado.create.mockResolvedValue(createdGastoVariado);

      const result = await service.create(orcamento_id, createGastoDto);

      expect(result).toStrictEqual(toResponseDto(createdGastoVariado));
      expect(mockPrismaService.gastoVariado.create).toHaveBeenCalledWith({
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
      const calls = mockPrismaService.gastoVariado.findMany.mock.calls;
      if (!calls.length) throw new Error("findMany não foi chamado");
      return calls[calls.length - 1][0].where;
    }

    async function findAllWhere(filters: GastoVariadoFindDto) {
      await service.findAll(1, filters);
      return getLastFindManyWhere();
    }

    it("should return an array of gasto variado", async () => {
      const orcamento_id = faker.number.int();

      const gastosVariados = [
        buildGastoVariado({
          id: 1,
          descricao: "Gasto Variado A",
          valor: new Prisma.Decimal("1000.00"),
          observacoes: "Descrição A",
          categoria_id: 1,
          orcamento_id,
          categoriaGasto: buildCategoriaGasto({ id: 1, nome: "Categoria A", usuario_id: 1 }),
        }),
        buildGastoVariado({
          id: 2,
          descricao: "Gasto Variado B",
          valor: new Prisma.Decimal("500.00"),
          observacoes: "Descrição B",
          categoria_id: 2,
          orcamento_id,
          categoriaGasto: buildCategoriaGasto({ id: 2, nome: "Categoria B", usuario_id: 2 }),
        }),
      ];

      mockPrismaService.gastoVariado.findMany.mockResolvedValue(gastosVariados);

      const result = await service.findAll(orcamento_id, {});

      expect(result).toStrictEqual(gastosVariados.map(toResponseDto));
      expect(mockPrismaService.gastoVariado.findMany).toHaveBeenCalledWith({
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

    it("should filter by nome_categoria", async () => {
      const nome = faker.string.alpha(10);
      expect(await findAllWhere({ nome_categoria: nome })).toStrictEqual({
        ...BASE_WHERE,
        categoriaGasto: { nome: { contains: nome } },
      });
    });

    it("should apply all filters together", async () => {
      const descricao = faker.string.alpha(10);
      const nome_categoria = faker.string.alpha(10);
      const inicio = new Date("2026-02-01");
      const fim = new Date("2026-02-10");

      expect(
        await findAllWhere({
          descricao,
          data_pgto_inicio: inicio,
          data_pgto_fim: fim,
          nome_categoria,
        }),
      ).toStrictEqual({
        ...BASE_WHERE,
        descricao: { contains: descricao },
        categoriaGasto: { nome: { contains: nome_categoria } },
        data_pgto: { gte: inicio, lte: fim },
      });
    });

    it("should not add extra operators when no filters", async () => {
      expect(await findAllWhere({})).toStrictEqual(BASE_WHERE);
    });
  });

  describe("findOne", () => {
    it("should return a single gasto variado by id", async () => {
      const orcamento_id = faker.number.int();
      const gasto_variado_id = faker.number.int();
      const gastoVariado = buildGastoVariado({ orcamento_id });

      mockPrismaService.gastoVariado.findUnique.mockResolvedValue(gastoVariado);

      const result = await service.findOne(orcamento_id, gasto_variado_id);

      expect(result).toStrictEqual(toResponseDto(gastoVariado));
      expect(mockPrismaService.gastoVariado.findUnique).toHaveBeenCalledWith({
        include: { categoriaGasto: true },
        where: { id: gasto_variado_id, orcamento_id, soft_delete: null },
      });
    });

    it("should return null if gasto variado not found", async () => {
      mockPrismaService.gastoVariado.findUnique.mockResolvedValue(null);

      const result = await service.findOne(faker.number.int(), 999);

      expect(result).toBeNull();
      expect(mockPrismaService.gastoVariado.findUnique).toHaveBeenCalledWith({
        include: { categoriaGasto: true },
        where: { id: 999, orcamento_id: expect.any(Number), soft_delete: null },
      });
    });
  });

  describe("update", () => {
    it("should update a gasto variado", async () => {
      const orcamento_id = faker.number.int();
      const gasto_variado_id = faker.number.int();

      const updateGastoDto: GastoVariadoUpdateDto = {
        descricao: "Gasto Variado A Atualizado",
        valor: "1500.00",
        data_pgto: new Date(),
        observacoes: "Descrição do Gasto Variado A Atualizado",
      };

      const updatedGastoVariado = buildGastoVariado({ orcamento_id });

      mockPrismaService.gastoVariado.update.mockResolvedValue(updatedGastoVariado);

      const result = await service.update(orcamento_id, gasto_variado_id, updateGastoDto);

      expect(result).toStrictEqual(toResponseDto(updatedGastoVariado));
      expect(mockPrismaService.gastoVariado.update).toHaveBeenCalledWith({
        include: { categoriaGasto: true },
        where: { id: gasto_variado_id, orcamento_id, soft_delete: null },
        data: updateGastoDto,
      });
    });
  });

  describe("softDelete", () => {
    it("should perform a soft delete of a gasto variado", async () => {
      const orcamento_id = faker.number.int();
      const gasto_variado_id = faker.number.int();

      let capturedGastoVariado: GastoVariadoWithCategoria;
      mockPrismaService.gastoVariado.update.mockImplementation(() => {
        capturedGastoVariado = buildGastoVariado({ orcamento_id, soft_delete: new Date() });
        return Promise.resolve(capturedGastoVariado);
      });

      const result = await service.softDelete(orcamento_id, gasto_variado_id);

      expect(result).toStrictEqual(toResponseDto(capturedGastoVariado));
      expect(mockPrismaService.gastoVariado.update).toHaveBeenCalledWith({
        include: { categoriaGasto: true },
        where: { id: gasto_variado_id, orcamento_id, soft_delete: null },
        data: { soft_delete: expect.any(Date) },
      });
    });
  });
});
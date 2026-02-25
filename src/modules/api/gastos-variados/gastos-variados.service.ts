import { Inject, Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { GastoVariadoCreateDto } from "./dtos/GastoVariadoCreate.dto";
import { GastoVariadoUpdateDto } from "./dtos/GastoVariadoUpdate.dto";
import { GastoVariado, Prisma } from "@prisma/client";
import { GastoVariadoFindDto } from "./dtos/GastoVariadoFind.dto";

@Injectable()
export class GastosVariadosService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async create(
    orcamento_id: number,
    createGastoDto: GastoVariadoCreateDto,
  ): Promise<GastoVariado> {
    return await this.prisma.gastoVariado.create({
      include: {
        categoriaGasto: true,
      },
      data: {
        ...createGastoDto,
        orcamento_id,
      },
    });
  }

  async findAll(
    orcamento_id: number,
    filters: GastoVariadoFindDto,
  ): Promise<GastoVariado[]> {
    const where: Prisma.GastoVariadoWhereInput = {
      orcamento_id,
      soft_delete: null,
      ...this.buildDescricaoFilter(filters),
      ...this.buildCategoriaGastoFilter(filters),
      ...this.buildDataPgtoFilter(filters),
    };

    return this.prisma.gastoVariado.findMany({
      include: {
        categoriaGasto: true,
      },
      where,
    });
  }

  /**
   * Filtra por descrição parcial (LIKE %descricao%).
   */
  private buildDescricaoFilter(
    filters: GastoVariadoFindDto,
  ): Prisma.GastoVariadoWhereInput {
    if (!filters.descricao) return {};

    return { descricao: { contains: filters.descricao } };
  }

  /**
   * Constrói o filtro relacional de categoria do gasto.
   *
   * Aplica uma busca parcial (LIKE %valor%) no nome da categoria associada
   * ao gasto fixo através da relação `categoriaGasto`.
   *
   * Exemplo:
   * nome_categoria = "mor" - categorias "Moradia", "Morar sozinho", etc.
   *
   * Retorna um objeto compatível com `Prisma.GastoVariadoWhereInput`
   * para ser mesclado ao `where` principal.
   */
  private buildCategoriaGastoFilter(
    filters: GastoVariadoFindDto,
  ): Prisma.GastoVariadoWhereInput {
    if (!filters.nome_categoria) return {};

    return {
      categoriaGasto: {
        nome: { contains: filters.nome_categoria },
      },
    };
  }

  /**
   * Constrói o filtro para o campo data_pgto baseado nos parâmetros fornecidos
   *
   * @param filters - DTO contendo os filtros de busca para gastos variados
   * @returns Objeto de filtro do Prisma para a cláusula WHERE
   *
   * @example
   * // Retorna { data_pgto: { equals: '2024-01-01' } }
   * buildDataPgtoFilter({ data_pgto: '2024-01-01' })
   *
   * @example
   * // Retorna { data_pgto: { gte: '2024-01-01', lte: '2024-12-31' } }
   * buildDataPgtoFilter({ data_pgto_inicio: '2024-01-01', data_pgto_fim: '2024-12-31' })
   *
   * @example
   * // Retorna {} (objeto vazio quando nenhum filtro é aplicado)
   * buildDataPgtoFilter({})
   */
  private buildDataPgtoFilter(
    filters: GastoVariadoFindDto,
  ): Prisma.GastoVariadoWhereInput {
    // Inicializa o filtro como undefined (sem filtro aplicado)
    let dataPgtoFilter: Prisma.DateTimeNullableFilter | undefined;

    // 1. Filtro por data exata
    // Aplica o filtro 'equals' quando uma data específica é fornecida
    if (filters.data_pgto) {
      dataPgtoFilter = {
        ...dataPgtoFilter,
        equals: filters.data_pgto,
      };
    }

    // 2. Filtro por intervalo de datas
    // Aplica os filtros 'gte' (maior ou igual) e/ou 'lte' (menor ou igual)
    // quando um intervalo de datas é fornecido
    // IMPORTANTE: Este filtro pode ser combinado com o filtro de data exata,
    // o que pode resultar em condições contraditórias
    if (filters.data_pgto_inicio || filters.data_pgto_fim) {
      dataPgtoFilter = {
        ...dataPgtoFilter,
        ...(filters.data_pgto_inicio && { gte: filters.data_pgto_inicio }),
        ...(filters.data_pgto_fim && { lte: filters.data_pgto_fim }),
      };
    }

    // 3. Retorno do filtro
    // Se nenhum filtro foi aplicado, retorna objeto vazio
    // Caso contrário, retorna o objeto de filtro estruturado para o Prisma
    if (dataPgtoFilter === undefined) {
      return {};
    }

    return { data_pgto: dataPgtoFilter };
  }

  async findOne(
    orcamento_id: number,
    id: number,
  ): Promise<GastoVariado | null> {
    return this.prisma.gastoVariado.findUnique({
      include: {
        categoriaGasto: true,
      },
      where: { id, orcamento_id, soft_delete: null },
    });
  }

  async update(
    orcamento_id: number,
    id: number,
    updateGastoDto: GastoVariadoUpdateDto,
  ): Promise<GastoVariado> {
    return this.prisma.gastoVariado.update({
      include: {
        categoriaGasto: true,
      },
      where: { id, orcamento_id, soft_delete: null },
      data: updateGastoDto,
    });
  }

  async softDelete(orcamento_id: number, id: number): Promise<GastoVariado> {
    return this.prisma.gastoVariado.update({
      include: {
        categoriaGasto: true,
      },
      where: { id, orcamento_id, soft_delete: null },
      data: {
        soft_delete: new Date(),
      },
    });
  }
}

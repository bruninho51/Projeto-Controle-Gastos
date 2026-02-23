import { Inject, Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { GastoFixoCreateDto } from "./dtos/GastoFixoCreate.dto";
import { GastoFixoUpdateDto } from "./dtos/GastoFixoUpdate.dto";
import { GastoFixo, Prisma } from "@prisma/client";
import { GastoFixoFindDto, StatusGasto } from "./dtos/GastoFixoFind.dto";

@Injectable()
export class GastosFixosService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async create(
    orcamento_id: number,
    createGastoDto: GastoFixoCreateDto,
  ): Promise<GastoFixo> {
    return await this.prisma.gastoFixo.create({
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
    filters: GastoFixoFindDto,
  ): Promise<GastoFixo[]> {
    const where: Prisma.GastoFixoWhereInput = {
      orcamento_id,
      soft_delete: null,
      ...this.buildDescricaoFilter(filters),
      ...this.buildCategoriaGastoFilter(filters),
      ...this.buildDataPgtoFilter(filters),
      ...this.buildVencidoFilter(filters),
    };

    return this.prisma.gastoFixo.findMany({
      include: { categoriaGasto: true },
      where,
    });
  }

  /**
   * Filtra por descrição parcial (LIKE %descricao%).
   */
  private buildDescricaoFilter(
    filters: GastoFixoFindDto,
  ): Prisma.GastoFixoWhereInput {
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
   * Retorna um objeto compatível com `Prisma.GastoFixoWhereInput`
   * para ser mesclado ao `where` principal.
   */
  private buildCategoriaGastoFilter(
    filters: GastoFixoFindDto,
  ): Prisma.GastoFixoWhereInput {
    if (!filters.nome_categoria) return {};

    return {
      categoriaGasto: {
        nome: { contains: filters.nome_categoria },
      },
    };
  }

  /**
   * Filtra por data de pagamento, mesclando até três fontes em ordem crescente de precedência:
   *   1. status     - base: pago (not null) ou não pago (equals null)
   *   2. data_pgto  - dia exato, sobrescreve o equals do status se houver
   *   3. intervalo  - gte/lte, mescla sobre o que já existe
   *
   * Usar DateTimeNullableFilter em vez de `null` direto permite o merge entre as fontes.
   */
  private buildDataPgtoFilter(
    filters: GastoFixoFindDto,
  ): Prisma.GastoFixoWhereInput {
    let dataPgto: Prisma.DateTimeNullableFilter | undefined;

    // 1. status como base
    if (filters.status === StatusGasto.PAGO) {
      dataPgto = { not: null };
    } else if (filters.status === StatusGasto.NAO_PAGO) {
      dataPgto = { equals: null };
    }

    // 2. data exata (sobrescreve o equals do status, mantém o rest)
    if (filters.data_pgto) {
      dataPgto = { ...dataPgto, equals: filters.data_pgto };
    }

    // 3. intervalo (mescla sobre status e/ou data exata)
    if (filters.data_pgto_inicio || filters.data_pgto_fim) {
      dataPgto = {
        ...dataPgto,
        ...(filters.data_pgto_inicio && { gte: filters.data_pgto_inicio }),
        ...(filters.data_pgto_fim && { lte: filters.data_pgto_fim }),
      };
    }

    if (dataPgto === undefined) return {};

    return { data_pgto: dataPgto };
  }

  /**
   * Filtra por situação de vencimento:
   *   - vencido=true  - sem pagamento E data de vencimento já passou (AND)
   *   - vencido=false - exclui registros que se enquadrariam no critério acima (NOT AND)
   */
  private buildVencidoFilter(
    filters: GastoFixoFindDto,
  ): Prisma.GastoFixoWhereInput {
    if (filters.vencido === undefined) return {};

    const hoje = new Date();
    const condicaoVencido: Prisma.GastoFixoWhereInput[] = [
      { data_pgto: null },
      { data_venc: { lt: hoje } },
    ];

    if (filters.vencido) {
      return { AND: condicaoVencido };
    }

    return { NOT: { AND: condicaoVencido } };
  }

  async findOne(orcamento_id: number, id: number): Promise<GastoFixo | null> {
    return this.prisma.gastoFixo.findUnique({
      include: {
        categoriaGasto: true,
      },
      where: { id, orcamento_id, soft_delete: null },
    });
  }

  async update(
    orcamento_id: number,
    id: number,
    updateGastoDto: GastoFixoUpdateDto,
  ): Promise<GastoFixo> {
    return this.prisma.gastoFixo.update({
      include: {
        categoriaGasto: true,
      },
      where: { id, orcamento_id, soft_delete: null },
      data: updateGastoDto,
    });
  }

  async softDelete(orcamento_id: number, id: number): Promise<GastoFixo> {
    return this.prisma.gastoFixo.update({
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

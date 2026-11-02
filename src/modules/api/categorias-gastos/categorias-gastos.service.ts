import { ConflictException, Inject, Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CategoriaGastoCreateDto } from "./dtos/CategoriaGastoCreate.dto";
import { CategoriaGastoUpdateDto } from "./dtos/CategoriaGastoUpdate.dto";
import { CategoriaGastoResponseDto } from "./dtos/CategoriaGastoResponse.dto";
import { CategoriaGastoFindDto } from "./dtos/CategoriaGastoFind.dto";
import { Prisma, TipoCategoriaGasto } from "@prisma/client";

@Injectable()
export class CategoriasGastosService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async findAll(
    usuarioId: number,
    filters: CategoriaGastoFindDto,
  ): Promise<CategoriaGastoResponseDto[]> {
    const categorias = await this.prisma.categoriaGasto.findMany({
      where: {
        usuario_id: usuarioId,
        soft_delete: null,
        ...this.buildNomeFilter(filters),
        ...(filters.tipo && { tipo: filters.tipo }),
      },
    });

    return categorias.map((c) => CategoriaGastoResponseDto.fromEntity(c));
  }

  /**
   * Filtra por nome parcial (LIKE %nome%).
   */
  private buildNomeFilter(
    filters: CategoriaGastoFindDto,
  ): Prisma.CategoriaGastoWhereInput {
    if (!filters.nome) return {};

    return { nome: { contains: filters.nome } };
  }

  async findOne(
    usuarioId: number,
    id: number,
  ): Promise<CategoriaGastoResponseDto | null> {
    const categoria = await this.prisma.categoriaGasto.findUnique({
      where: { id, usuario_id: usuarioId, soft_delete: null },
    });

    return categoria ? CategoriaGastoResponseDto.fromEntity(categoria) : null;
  }

  async create(
    usuarioId: number,
    createCategoriaDto: CategoriaGastoCreateDto,
  ): Promise<CategoriaGastoResponseDto> {
    const categoria = await this.prisma.categoriaGasto.create({
      data: { ...createCategoriaDto, usuario_id: usuarioId },
    });

    return CategoriaGastoResponseDto.fromEntity(categoria);
  }

  async update(
    usuarioId: number,
    id: number,
    updateCategoriaDto: CategoriaGastoUpdateDto,
  ): Promise<CategoriaGastoResponseDto> {
    if (updateCategoriaDto.tipo) {
      await this.assertTipoAlteravel(usuarioId, id, updateCategoriaDto.tipo);
    }

    const categoria = await this.prisma.categoriaGasto.update({
      where: { id, usuario_id: usuarioId, soft_delete: null },
      data: updateCategoriaDto,
    });

    return CategoriaGastoResponseDto.fromEntity(categoria);
  }

  /**
   * Trocar o tipo reclassificaria retroativamente os gastos já lançados,
   * então só é permitido enquanto a categoria não tiver gastos ativos.
   */
  private async assertTipoAlteravel(
    usuarioId: number,
    id: number,
    novoTipo: TipoCategoriaGasto,
  ): Promise<void> {
    const categoria = await this.prisma.categoriaGasto.findUnique({
      where: { id, usuario_id: usuarioId, soft_delete: null },
      select: {
        tipo: true,
        _count: {
          select: {
            gastosFixos: { where: { soft_delete: null } },
            gastosVariados: { where: { soft_delete: null } },
          },
        },
      },
    });

    if (!categoria || categoria.tipo === novoTipo) return;

    const { gastosFixos, gastosVariados } = categoria._count;
    if (gastosFixos + gastosVariados > 0) {
      throw new ConflictException(
        "Não é possível alterar o tipo de uma categoria que já possui gastos lançados.",
      );
    }
  }

  async softDelete(
    usuarioId: number,
    id: number,
  ): Promise<CategoriaGastoResponseDto> {
    const categoria = await this.prisma.categoriaGasto.update({
      where: { id, usuario_id: usuarioId, soft_delete: null },
      data: {
        soft_delete: new Date(),
      },
    });

    return CategoriaGastoResponseDto.fromEntity(categoria);
  }
}

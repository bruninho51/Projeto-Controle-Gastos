import { Inject, Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { OrcamentoUpdateDto } from "./dtos/OrcamentoUpdate.dto";
import { OrcamentoCreateDto } from "./dtos/OrcamentoCreate.dto";
import { OrcamentoResponseDto } from "./dtos/OrcamentoResponse.dto";
import { OrcamentoFindDto } from "./dtos/OrcamentoFind.dto";
import { Prisma } from "@prisma/client";

@Injectable()
export class OrcamentosService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async create(
    usuarioId: number,
    createOrcamentoDto: OrcamentoCreateDto,
  ): Promise<OrcamentoResponseDto> {
    const orcamento = await this.prisma.orcamento.create({
      data: { ...createOrcamentoDto, usuario_id: usuarioId },
    });

    return OrcamentoResponseDto.fromEntity(orcamento);
  }

  async findAll(
    usuarioId: number,
    filters: OrcamentoFindDto,
  ): Promise<OrcamentoResponseDto[]> {
    const where: Prisma.OrcamentoWhereInput = {
      usuario_id: usuarioId,
      soft_delete: null,
      ...this.buildNomeFilter(filters),
      ...this.buildEncerradoFilter(filters),
      ...this.buildInativoFilter(filters),
    };

    const orcamentos = await this.prisma.orcamento.findMany({ where });

    return orcamentos.map((c) => OrcamentoResponseDto.fromEntity(c));
  }

  /**
   * Filtra por nome parcial (LIKE %nome%).
   */
  private buildNomeFilter(
    filters: OrcamentoFindDto,
  ): Prisma.OrcamentoWhereInput {
    if (!filters.nome) return {};

    return { nome: { contains: filters.nome } };
  }

  /**
   * Filtra orçamentos pelo status de encerramento:
   *   - encerrado=true  → data_encerramento preenchida (not null)
   *   - encerrado=false → data_encerramento ausente (null)
   */
  private buildEncerradoFilter(
    filters: OrcamentoFindDto,
  ): Prisma.OrcamentoWhereInput {
    if (filters.encerrado === undefined) return {};

    return {
      data_encerramento: filters.encerrado ? { not: null } : null,
    };
  }

  /**
   * Filtra orçamentos pelo status de inatividade:
   *   - inativo=true  → data_inatividade preenchida (not null)
   *   - inativo=false → data_inatividade ausente (null)
   */
  private buildInativoFilter(
    filters: OrcamentoFindDto,
  ): Prisma.OrcamentoWhereInput {
    if (filters.inativo === undefined) return {};

    return {
      data_inatividade: filters.inativo ? { not: null } : null,
    };
  }

  async findOne(
    usuarioId: number,
    id: number,
  ): Promise<OrcamentoResponseDto | null> {
    const orcamento = await this.prisma.orcamento.findUnique({
      where: { id, usuario_id: usuarioId, soft_delete: null },
    });

    return OrcamentoResponseDto.fromEntity(orcamento);
  }

  async update(
    usuarioId: number,
    id: number,
    updateOrcamentoDto: OrcamentoUpdateDto,
  ): Promise<OrcamentoResponseDto> {
    const orcamento = await this.prisma.orcamento.update({
      where: { id, usuario_id: usuarioId, soft_delete: null },
      data: updateOrcamentoDto,
    });

    return OrcamentoResponseDto.fromEntity(orcamento);
  }

  async softDelete(
    usuarioId: number,
    id: number,
  ): Promise<OrcamentoResponseDto> {
    const orcamento = await this.prisma.orcamento.update({
      where: { id, usuario_id: usuarioId, soft_delete: null },
      data: { soft_delete: new Date() },
    });

    return OrcamentoResponseDto.fromEntity(orcamento);
  }
}

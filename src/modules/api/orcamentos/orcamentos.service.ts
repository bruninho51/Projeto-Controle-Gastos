import { Inject, Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { OrcamentoUpdateDto } from "./dtos/OrcamentoUpdate.dto";
import { OrcamentoCreateDto } from "./dtos/OrcamentoCreate.dto";
import { OrcamentoResponseDto } from "./dtos/OrcamentoResponse.dto";

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

  async findAll(usuarioId: number): Promise<OrcamentoResponseDto[]> {
    const orcamentos = await this.prisma.orcamento.findMany({
      where: { usuario_id: usuarioId, soft_delete: null },
    });

    return orcamentos.map((c) => OrcamentoResponseDto.fromEntity(c));
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
      data: {
        soft_delete: new Date(),
      },
    });

    return OrcamentoResponseDto.fromEntity(orcamento);
  }
}

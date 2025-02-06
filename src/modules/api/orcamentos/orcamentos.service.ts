import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { Orcamento } from "@prisma/client";
import { OrcamentoUpdateDto } from "./dtos/OrcamentoUpdate.dto";
import { OrcamentoCreateDto } from "./dtos/OrcamentoCreate.dto";

@Injectable()
export class OrcamentosService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    usuarioId: number,
    createOrcamentoDto: OrcamentoCreateDto,
  ): Promise<Orcamento> {
    return await this.prisma.orcamento.create({
      data: { ...createOrcamentoDto, usuario_id: usuarioId },
    });
  }

  async findAll(usuarioId: number): Promise<Orcamento[]> {
    return this.prisma.orcamento.findMany({
      where: { usuario_id: usuarioId, soft_delete: null },
    });
  }

  async findOne(usuarioId: number, id: number): Promise<Orcamento | null> {
    return this.prisma.orcamento.findUnique({
      where: { id, usuario_id: usuarioId, soft_delete: null },
    });
  }

  async update(
    usuarioId: number,
    id: number,
    updateOrcamentoDto: OrcamentoUpdateDto,
  ): Promise<Orcamento> {
    return this.prisma.orcamento.update({
      where: { id, usuario_id: usuarioId, soft_delete: null },
      data: updateOrcamentoDto,
    });
  }

  async softDelete(usuarioId: number, id: number): Promise<Orcamento> {
    return this.prisma.orcamento.update({
      where: { id, usuario_id: usuarioId, soft_delete: null },
      data: {
        soft_delete: new Date(),
      },
    });
  }
}

import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { InvestimentoCreateDto } from "./dtos/InvestimentoCreate.dto";
import { Investimento } from "@prisma/client";
import { InvestimentoUpdateDto } from "./dtos/InvestimentoUpdate.dto";

@Injectable()
export class InvestimentosService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    usuarioId: number,
    createInvestimentoDto: InvestimentoCreateDto,
  ): Promise<Investimento> {
    return await this.prisma.investimento.create({
      data: { ...createInvestimentoDto, usuario_id: usuarioId },
    });
  }

  async findAll(usuarioId: number): Promise<Investimento[]> {
    return this.prisma.investimento.findMany({
      where: { usuario_id: usuarioId, soft_delete: null },
    });
  }

  async findOne(usuarioId: number, id: number): Promise<Investimento> {
    return this.prisma.investimento.findUnique({
      where: { usuario_id: usuarioId, id, soft_delete: null },
    });
  }

  async update(
    usuarioId: number,
    id: number,
    updateInvestimentoDto: InvestimentoUpdateDto,
  ): Promise<Investimento> {
    return this.prisma.investimento.update({
      where: { id, usuario_id: usuarioId, soft_delete: null },
      data: updateInvestimentoDto,
    });
  }

  async softDelete(usuarioId: number, id: number): Promise<Investimento> {
    return this.prisma.investimento.update({
      where: { id, usuario_id: usuarioId, soft_delete: null },
      data: {
        soft_delete: new Date(),
      },
    });
  }
}

import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { InvestimentoCreateDto } from "./dtos/InvestimentoCreate.dto";
import { Investimento } from "@prisma/client";
import { InvestimentoUpdateDto } from "./dtos/InvestimentoUpdate.dto";

@Injectable()
export class InvestimentosService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    createInvestimentoDto: InvestimentoCreateDto,
  ): Promise<Investimento> {
    const categoria_id = createInvestimentoDto.categoria_id;
    return await this.prisma.investimento.create({
      data: createInvestimentoDto,
    });
  }

  async findAll(): Promise<Investimento[]> {
    return this.prisma.investimento.findMany({
      where: { soft_delete: null },
    });
  }

  async findOne(id: number): Promise<Investimento | null> {
    return this.prisma.investimento.findUnique({
      where: { id, soft_delete: null },
    });
  }

  async update(
    id: number,
    updateInvestimentoDto: InvestimentoUpdateDto,
  ): Promise<Investimento> {
    return this.prisma.investimento.update({
      where: { id, soft_delete: null },
      data: updateInvestimentoDto,
    });
  }

  async softDelete(id: number): Promise<Investimento> {
    return this.prisma.investimento.update({
      where: { id, soft_delete: null },
      data: {
        soft_delete: new Date(),
      },
    });
  }
}

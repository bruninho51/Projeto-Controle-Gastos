import { Inject, Injectable } from "@nestjs/common";
import { PrismaService } from "../../../modules/prisma/prisma.service";
import { RegistroInvestimentoLinhaDoTempoCreateDto } from "./dtos/RegistroInvestimentoLinhaDoTempoCreate.dto";
import { LinhaDoTempoInvestimento } from "@prisma/client";
import { RegistroInvestimentoLinhaDoTempoUpdateDto } from "./dtos/RegistroInvestimentoLinhaDoTempoUpdate.dto";

@Injectable()
export class LinhaDoTempoInvestimentosService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async create(
    investimento_id: number,
    registroLinhaDoTempoCreateDto: RegistroInvestimentoLinhaDoTempoCreateDto,
  ): Promise<LinhaDoTempoInvestimento> {
    return await this.prisma.linhaDoTempoInvestimento.create({
      data: {
        ...registroLinhaDoTempoCreateDto,
        investimento_id,
      },
    });
  }

  async findAll(investimento_id: number): Promise<LinhaDoTempoInvestimento[]> {
    return this.prisma.linhaDoTempoInvestimento.findMany({
      where: { soft_delete: null, investimento_id },
    });
  }

  async findOne(
    investimento_id: number,
    id: number,
  ): Promise<LinhaDoTempoInvestimento | null> {
    return this.prisma.linhaDoTempoInvestimento.findUnique({
      where: { id, investimento_id, soft_delete: null },
    });
  }

  async update(
    investimento_id: number,
    id: number,
    registroLinhaDoTempoUpdateDto: RegistroInvestimentoLinhaDoTempoUpdateDto,
  ): Promise<LinhaDoTempoInvestimento> {
    return this.prisma.linhaDoTempoInvestimento.update({
      where: { id, investimento_id, soft_delete: null },
      data: registroLinhaDoTempoUpdateDto,
    });
  }

  async softDelete(
    investimento_id: number,
    id: number,
  ): Promise<LinhaDoTempoInvestimento> {
    return this.prisma.linhaDoTempoInvestimento.update({
      where: { id, investimento_id, soft_delete: null },
      data: {
        soft_delete: new Date(),
      },
    });
  }
}

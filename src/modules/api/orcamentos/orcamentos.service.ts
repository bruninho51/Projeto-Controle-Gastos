import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Orcamento } from '@prisma/client';
import { OrcamentoUpdateInputDto } from './dtos/OrcamentoUpdateInput.dto';
import { OrcamentoCreateInputDto } from './dtos/OrcamentoCreateInput.dto';

@Injectable()
export class OrcamentosService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createOrcamentoDto: OrcamentoCreateInputDto): Promise<Orcamento> {
    return await this.prisma.orcamento.create({
      data: createOrcamentoDto,
    });
  }

  async findAll(): Promise<Orcamento[]> {
    return this.prisma.orcamento.findMany({
      where: { soft_delete: null },
    });
  }

  async findOne(id: number): Promise<Orcamento | null> {
    return this.prisma.orcamento.findUnique({
      where: { id, soft_delete: null },
    });
  }

  async update(id: number, updateOrcamentoDto: OrcamentoUpdateInputDto): Promise<Orcamento> {
    return this.prisma.orcamento.update({
      where: { id, soft_delete: null },
      data: updateOrcamentoDto,
    });
  }

  async softDelete(id: number): Promise<Orcamento> {
    return this.prisma.orcamento.update({
      where: { id, soft_delete: null },
      data: {
        soft_delete: new Date(),
      },
    });
  }
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GastoFixoCreateInputDto } from './dtos/GastoFixoCreateInput.dto';
import { GastoFixoUpdateInputDto } from './dtos/GastoFixoUpdateInput.dto';
import { GastoFixo } from '@prisma/client';

@Injectable()
export class GastosFixosService {
  constructor(private prisma: PrismaService) {}

  async create(orcamento_id: number, createGastoDto: GastoFixoCreateInputDto): Promise<GastoFixo> {
    return await this.prisma.gastoFixo.create({
      data: {
        ...createGastoDto,
        orcamento_id
      },
    });
  }

  async findAll(orcamento_id: number): Promise<GastoFixo[]> {
    return this.prisma.gastoFixo.findMany({
        where: { soft_delete: null, orcamento_id }
    });
  }

  async findOne(orcamento_id: number, id: number): Promise<GastoFixo | null> {
    return this.prisma.gastoFixo.findUnique({
      where: { id, orcamento_id, soft_delete: null },
    });
  }

  async update(orcamento_id: number, id: number, updateGastoDto: GastoFixoUpdateInputDto): Promise<GastoFixo> {
    return this.prisma.gastoFixo.update({
      where: { id, orcamento_id, soft_delete: null },
      data: updateGastoDto,
    });
  }

  async softDelete(orcamento_id: number, id: number): Promise<GastoFixo> {
    return this.prisma.gastoFixo.update({
      where: { id, orcamento_id, soft_delete: null },
      data: {
        soft_delete: new Date(),
      },
    });
  }
}

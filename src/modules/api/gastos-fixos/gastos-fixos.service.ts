import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GastoFixoCreateInputDto } from './dtos/GastoFixoCreateInput.dto';
import { GastoFixoUpdateInputDto } from './dtos/GastoFixoUpdateInput.dto';
import { GastoFixo } from '@prisma/client';

@Injectable()
export class GastosFixosService {
  constructor(private prisma: PrismaService) {}

  async create(createGastoDto: GastoFixoCreateInputDto): Promise<GastoFixo> {
    return await this.prisma.gastoFixo.create({
      data: createGastoDto,
    });
  }

  async findAll(): Promise<GastoFixo[]> {
    return this.prisma.gastoFixo.findMany({
        where: { soft_delete: null }
    });
  }

  async findOne(id: number): Promise<GastoFixo | null> {
    return this.prisma.gastoFixo.findUnique({
      where: { id, soft_delete: null },
    });
  }

  async update(id: number, updateGastoDto: GastoFixoUpdateInputDto): Promise<GastoFixo> {
    return this.prisma.gastoFixo.update({
      where: { id, soft_delete: null },
      data: updateGastoDto,
    });
  }

  async softDelete(id: number): Promise<GastoFixo> {
    return this.prisma.gastoFixo.update({
      where: { id, soft_delete: null },
      data: {
        soft_delete: new Date(),
      },
    });
  }
}

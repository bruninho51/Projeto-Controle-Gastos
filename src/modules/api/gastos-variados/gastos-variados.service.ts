import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GastoVariadoCreateDto } from './dtos/GastoVariadoCreate.dto';
import { GastoVariadoUpdateDto } from './dtos/GastoVariadoUpdate.dto';
import { GastoVariado } from '@prisma/client';

@Injectable()
export class GastosVariadosService {
  constructor(private prisma: PrismaService) {}

  async create(orcamento_id: number, createGastoDto: GastoVariadoCreateDto): Promise<GastoVariado> {
    return await this.prisma.gastoVariado.create({
      data: {
        ...createGastoDto,
        orcamento_id
      },
    });
  }

  async findAll(orcamento_id: number): Promise<GastoVariado[]> {
    return this.prisma.gastoVariado.findMany({
        where: { soft_delete: null, orcamento_id }
    });
  }

  async findOne(orcamento_id: number, id: number): Promise<GastoVariado | null> {
    return this.prisma.gastoVariado.findUnique({
      where: { id, orcamento_id, soft_delete: null },
    });
  }

  async update(orcamento_id: number, id: number, updateGastoDto: GastoVariadoUpdateDto): Promise<GastoVariado> {
    return this.prisma.gastoVariado.update({
      where: { id, orcamento_id, soft_delete: null },
      data: updateGastoDto,
    });
  }

  async softDelete(orcamento_id: number, id: number): Promise<GastoVariado> {
    return this.prisma.gastoVariado.update({
      where: { id, orcamento_id, soft_delete: null },
      data: {
        soft_delete: new Date(),
      },
    });
  }
}

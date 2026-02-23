import { Inject, Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { GastoVariadoCreateDto } from "./dtos/GastoVariadoCreate.dto";
import { GastoVariadoUpdateDto } from "./dtos/GastoVariadoUpdate.dto";
import { GastoVariado } from "@prisma/client";

@Injectable()
export class GastosVariadosService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async create(
    orcamento_id: number,
    createGastoDto: GastoVariadoCreateDto,
  ): Promise<GastoVariado> {
    return await this.prisma.gastoVariado.create({
      include: {
        categoriaGasto: true,
      },
      data: {
        ...createGastoDto,
        orcamento_id,
      },
    });
  }

  async findAll(orcamento_id: number): Promise<GastoVariado[]> {
    return this.prisma.gastoVariado.findMany({
      include: {
        categoriaGasto: true,
      },
      where: { soft_delete: null, orcamento_id },
    });
  }

  async findOne(
    orcamento_id: number,
    id: number,
  ): Promise<GastoVariado | null> {
    return this.prisma.gastoVariado.findUnique({
      include: {
        categoriaGasto: true,
      },
      where: { id, orcamento_id, soft_delete: null },
    });
  }

  async update(
    orcamento_id: number,
    id: number,
    updateGastoDto: GastoVariadoUpdateDto,
  ): Promise<GastoVariado> {
    return this.prisma.gastoVariado.update({
      include: {
        categoriaGasto: true,
      },
      where: { id, orcamento_id, soft_delete: null },
      data: updateGastoDto,
    });
  }

  async softDelete(orcamento_id: number, id: number): Promise<GastoVariado> {
    return this.prisma.gastoVariado.update({
      include: {
        categoriaGasto: true,
      },
      where: { id, orcamento_id, soft_delete: null },
      data: {
        soft_delete: new Date(),
      },
    });
  }
}

import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { GastoFixoCreateDto } from "./dtos/GastoFixoCreate.dto";
import { GastoFixoUpdateDto } from "./dtos/GastoFixoUpdate.dto";
import { GastoFixo } from "@prisma/client";

@Injectable()
export class GastosFixosService {
  constructor(private prisma: PrismaService) {}

  async create(
    orcamento_id: number,
    createGastoDto: GastoFixoCreateDto,
  ): Promise<GastoFixo> {
    return await this.prisma.gastoFixo.create({
      include: {
        categoriaGasto: true,
      },
      data: {
        ...createGastoDto,
        orcamento_id,
      },
    });
  }

  async findAll(orcamento_id: number): Promise<GastoFixo[]> {
    return this.prisma.gastoFixo.findMany({
      include: {
        categoriaGasto: true,
      },
      where: { soft_delete: null, orcamento_id },
    });
  }

  async findOne(orcamento_id: number, id: number): Promise<GastoFixo | null> {
    return this.prisma.gastoFixo.findUnique({
      include: {
        categoriaGasto: true,
      },
      where: { id, orcamento_id, soft_delete: null },
    });
  }

  async update(
    orcamento_id: number,
    id: number,
    updateGastoDto: GastoFixoUpdateDto,
  ): Promise<GastoFixo> {
    return this.prisma.gastoFixo.update({
      include: {
        categoriaGasto: true,
      },
      where: { id, orcamento_id, soft_delete: null },
      data: updateGastoDto,
    });
  }

  async softDelete(orcamento_id: number, id: number): Promise<GastoFixo> {
    return this.prisma.gastoFixo.update({
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

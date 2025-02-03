import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CategoriaGastoCreateDto } from "./dtos/CategoriaGastoCreate.dto";
import { CategoriaGastoUpdateDto } from "./dtos/CategoriaGastoUpdate.dto";
import { CategoriaGasto } from "@prisma/client";

@Injectable()
export class CategoriasGastosService {
  constructor(private prisma: PrismaService) {}

  async findAll(usuarioId: number): Promise<CategoriaGasto[]> {
    return this.prisma.categoriaGasto.findMany({
      where: {
        usuario_id: usuarioId,
        soft_delete: null,
      },
    });
  }

  async findOne(usuarioId: number, id: number): Promise<CategoriaGasto | null> {
    return this.prisma.categoriaGasto.findUnique({
      where: { id, usuario_id: usuarioId, soft_delete: null },
    });
  }

  async create(
    usuarioId: number,
    createCategoriaDto: CategoriaGastoCreateDto,
  ): Promise<CategoriaGasto> {
    return this.prisma.categoriaGasto.create({
      data: { ...createCategoriaDto, usuario_id: usuarioId },
    });
  }

  async update(
    usuarioId: number,
    id: number,
    updateCategoriaDto: CategoriaGastoUpdateDto,
  ): Promise<CategoriaGasto> {
    return this.prisma.categoriaGasto.update({
      where: { id, usuario_id: usuarioId, soft_delete: null },
      data: updateCategoriaDto,
    });
  }

  async softDelete(usuarioId: number, id: number): Promise<CategoriaGasto> {
    return this.prisma.categoriaGasto.update({
      where: { id, usuario_id: usuarioId, soft_delete: null },
      data: {
        soft_delete: new Date(),
      },
    });
  }
}

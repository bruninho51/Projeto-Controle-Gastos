import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CategoriaGastoCreateInputDto } from './dtos/CategoriaGastoCreateInput.dto';
import { CategoriaGastoUpdateInputDto } from './dtos/CategoriaGastoUpdateInput.dto';
import { CategoriaGasto } from '@prisma/client';

@Injectable()
export class CategoriasGastosService {
  constructor(private prisma: PrismaService) {}

  async findAll(): Promise<CategoriaGasto[]> {
    return this.prisma.categoriaGasto.findMany({
      where: {
        soft_delete: null,
      },
    });
  }

  async create(createCategoriaDto: CategoriaGastoCreateInputDto): Promise<CategoriaGasto> {
    return this.prisma.categoriaGasto.create({
      data: createCategoriaDto,
    });
  }

  async update(id: number, updateCategoriaDto: CategoriaGastoUpdateInputDto): Promise<CategoriaGasto> {
    return this.prisma.categoriaGasto.update({
      where: { id, soft_delete: null },
      data: updateCategoriaDto,
    });
  }

  async softDelete(id: number): Promise<CategoriaGasto> {
    return this.prisma.categoriaGasto.update({
      where: { id, soft_delete: null },
      data: {
        soft_delete: new Date(),
      },
    });
  }
}

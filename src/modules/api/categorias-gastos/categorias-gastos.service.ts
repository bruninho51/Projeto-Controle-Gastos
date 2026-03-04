import { Inject, Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CategoriaGastoCreateDto } from "./dtos/CategoriaGastoCreate.dto";
import { CategoriaGastoUpdateDto } from "./dtos/CategoriaGastoUpdate.dto";
import { CategoriaGasto } from "@prisma/client";
import { CategoriaGastoResponseDto } from "./dtos/CategoriaGastoResponse.dto";

@Injectable()
export class CategoriasGastosService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async findAll(usuarioId: number): Promise<CategoriaGastoResponseDto[]> {
    const categorias = await this.prisma.categoriaGasto.findMany({
      where: {
        usuario_id: usuarioId,
        soft_delete: null,
      },
    });

    return categorias.map((c) => CategoriaGastoResponseDto.fromEntity(c));
  }

  async findOne(
    usuarioId: number,
    id: number,
  ): Promise<CategoriaGastoResponseDto | null> {
    const categoria = await this.prisma.categoriaGasto.findUnique({
      where: { id, usuario_id: usuarioId, soft_delete: null },
    });

    return categoria ? CategoriaGastoResponseDto.fromEntity(categoria) : null;
  }

  async create(
    usuarioId: number,
    createCategoriaDto: CategoriaGastoCreateDto,
  ): Promise<CategoriaGastoResponseDto> {
    const categoria = await this.prisma.categoriaGasto.create({
      data: { ...createCategoriaDto, usuario_id: usuarioId },
    });

    return CategoriaGastoResponseDto.fromEntity(categoria);
  }

  async update(
    usuarioId: number,
    id: number,
    updateCategoriaDto: CategoriaGastoUpdateDto,
  ): Promise<CategoriaGastoResponseDto> {
    const categoria = await this.prisma.categoriaGasto.update({
      where: { id, usuario_id: usuarioId, soft_delete: null },
      data: updateCategoriaDto,
    });

    return CategoriaGastoResponseDto.fromEntity(categoria);
  }

  async softDelete(
    usuarioId: number,
    id: number,
  ): Promise<CategoriaGastoResponseDto> {
    const categoria = await this.prisma.categoriaGasto.update({
      where: { id, usuario_id: usuarioId, soft_delete: null },
      data: {
        soft_delete: new Date(),
      },
    });

    return CategoriaGastoResponseDto.fromEntity(categoria);
  }
}

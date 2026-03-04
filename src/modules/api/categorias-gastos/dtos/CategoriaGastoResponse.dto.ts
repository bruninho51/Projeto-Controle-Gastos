import { ApiProperty } from "@nestjs/swagger";
import { CategoriaGasto } from "@prisma/client";
import { Exclude, Expose, plainToInstance } from "class-transformer";

@Exclude()
export class CategoriaGastoResponseDto {
  @Expose()
  @ApiProperty({
    example: 1,
    description: "Identificador da categoria",
  })
  id: number;

  @Expose()
  @ApiProperty({
    example: "Transporte Público",
    description: "Nome da categoria de gasto",
  })
  nome: string;

  @Expose()
  @ApiProperty({
    example: "2025-03-05T21:31:27.000Z",
    description: "Data de criação do registro",
  })
  data_criacao: Date;

  @Expose()
  @ApiProperty({
    example: "2025-03-05T21:31:27.000Z",
    description: "Data da última atualização do registro",
  })
  data_atualizacao: Date;

  @Expose()
  @ApiProperty({
    example: null,
    required: false,
    nullable: true,
    description: "Data em que a categoria foi inativada",
  })
  data_inatividade?: Date | null;

  constructor(partial: Partial<CategoriaGastoResponseDto>) {
    Object.assign(this, partial);
  }

  static fromEntity(entity: CategoriaGasto): CategoriaGastoResponseDto {
    return plainToInstance(
      CategoriaGastoResponseDto,
      {
        id: entity.id,
        nome: entity.nome,
        data_criacao: entity.data_criacao,
        data_atualizacao: entity.data_atualizacao,
        data_inatividade: entity.data_inatividade,
      },
      {
        excludeExtraneousValues: true,
      },
    );
  }
}

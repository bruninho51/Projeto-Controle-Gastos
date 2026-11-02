import {
  IsString,
  IsOptional,
  IsDate,
  IsNotEmpty,
  ValidateIf,
  IsEnum,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { TipoCategoriaGasto } from "@prisma/client";
import { Transform } from "class-transformer";

export class CategoriaGastoUpdateDto {
  @IsString()
  @IsNotEmpty()
  @ValidateIf((o) => o.nome === null || !!o.nome)
  @ApiProperty({
    description: "Nome da categoria",
    example: "Alimentação",
    required: false,
    nullable: true,
  })
  nome?: string | null;

  @IsOptional()
  @IsEnum(TipoCategoriaGasto)
  @ApiPropertyOptional({
    description:
      "Tipo da categoria. Só pode ser alterado enquanto a categoria não tiver gastos lançados.",
    enum: TipoCategoriaGasto,
    example: TipoCategoriaGasto.PATRIMONIO,
  })
  tipo?: TipoCategoriaGasto;

  @IsOptional()
  @IsDate()
  @Transform(({ value }) => (value ? new Date(value) : null))
  @ApiProperty({
    description: "Inativar a categoria de gastos",
    example: "2024-12-01",
    required: false,
    nullable: true,
  })
  data_inatividade?: Date | null;
}

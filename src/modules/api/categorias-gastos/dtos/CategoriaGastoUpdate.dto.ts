import {
  IsString,
  IsOptional,
  IsDate,
  IsNotEmpty,
  ValidateIf,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";

export class CategoriaGastoUpdateDto {
  @IsString()
  @IsNotEmpty()
  @ValidateIf((o) => o.nome === null || !!o.nome)
  @ApiProperty({
    description: "Nome da categoria",
    example: "Alimentação",
  })
  nome?: string;

  @IsOptional()
  @IsDate()
  @Transform(({ value }) => (value ? new Date(value) : null))
  @ApiProperty({
    description: "Inativar a categoria de gastos",
    example: "2024-12-01",
  })
  data_inatividade?: Date;
}

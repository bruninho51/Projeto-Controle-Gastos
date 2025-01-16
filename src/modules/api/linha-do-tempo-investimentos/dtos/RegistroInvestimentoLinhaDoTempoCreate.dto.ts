import {
  IsString,
  IsOptional,
  IsDecimal,
  IsInt,
  IsDate,
  IsNotEmpty,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";

export class RegistroInvestimentoLinhaDoTempoCreateDto {
  @IsDecimal()
  @IsNotEmpty()
  @ApiProperty({
    description: "Valor do investimento no dia",
    example: "1300.00",
  })
  valor: string;

  @IsDate()
  @IsNotEmpty()
  @Transform(({ value }) => (value ? new Date(value) : null))
  @ApiProperty({
    description: "Dia em que o investimento esteve com o referido valor",
    example: "2024-12-01",
  })
  data_registro: Date;
}

import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import {
  IsDate,
  IsDecimal,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateIf,
} from "class-validator";

export class OrcamentoUpdateDto {
  @IsString()
  @IsNotEmpty()
  @ValidateIf((o) => o.nome === null || !!o.nome)
  @ApiProperty({
    description: "Nome do orçamento",
    example: "JANEIRO 2025",
    required: false,
    nullable: true,
  })
  nome?: string | null;

  @IsDecimal()
  @IsNotEmpty()
  @ValidateIf((o) => o.valor_inicial === null || !!o.valor_inicial)
  @ApiProperty({
    description: "Valor inicial/salário",
    example: "2000.00",
    required: false,
    nullable: true,
  })
  valor_inicial?: string | null;

  @IsOptional()
  @IsDate()
  @Transform(({ value }) => (value ? new Date(value) : null))
  @ApiProperty({
    description: "Data de fechamento do orçamento",
    example: "2025-01-01",
    required: false,
    nullable: true,
  })
  data_encerramento?: Date | null;

  @IsOptional()
  @IsDate()
  @Transform(({ value }) => (value ? new Date(value) : null))
  @ApiProperty({
    description: "Inativar um registro de orçamento",
    example: "2024-12-01",
    required: false,
    nullable: true,
  })
  data_inatividade?: Date | null;
}

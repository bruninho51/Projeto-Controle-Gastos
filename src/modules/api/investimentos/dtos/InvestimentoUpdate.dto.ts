import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import {
  IsDate,
  IsDecimal,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateIf,
} from "class-validator";

export class InvestimentoUpdateDto {
  @IsString()
  @IsNotEmpty()
  @ValidateIf((o) => o.nome === null || !!o.nome)
  @ApiProperty({
    description: "Nome do investimento",
    example: "Poupança",
  })
  nome?: string;

  @IsString()
  @IsNotEmpty()
  @ValidateIf((o) => o.descricao === null || !!o.descricao)
  @ApiProperty({
    description: "Descrição do investimento",
    example: "Poupança Nubank",
  })
  descricao?: string;

  @IsDecimal()
  @IsNotEmpty()
  @ValidateIf((o) => o.valor_inicial === null || !!o.valor_inicial)
  @ApiProperty({
    description: "Aporte inicial do investimento",
    example: "2000.00",
  })
  valor_inicial?: string;

  @IsInt()
  @IsNotEmpty()
  @ValidateIf((o) => o.categoria_id === null || !!o.categoria_id)
  @ApiProperty({
    description: "ID da categoria do investimento",
    example: 1,
  })
  categoria_id?: number;

  @IsOptional()
  @IsDate()
  @Transform(({ value }) => (value ? new Date(value) : null))
  @ApiProperty({
    description: "Inativar um investimento",
    example: "2024-12-01",
  })
  data_inatividade?: Date;
}

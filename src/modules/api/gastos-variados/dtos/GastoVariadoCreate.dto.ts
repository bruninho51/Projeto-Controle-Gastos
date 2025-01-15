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

export class GastoVariadoCreateDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: "Descrição do gasto variado",
    example: "PIZZA",
  })
  descricao: string;

  @IsDecimal()
  @IsNotEmpty()
  @ApiProperty({
    description: "Valor",
    example: "130.00",
  })
  valor: string;

  @IsDate()
  @IsNotEmpty()
  @Transform(({ value }) => (value ? new Date(value) : null))
  @ApiProperty({
    description: "Data do pagamento",
    example: "2024-12-01",
  })
  data_pgto: Date;

  @IsInt()
  @IsNotEmpty()
  @ApiProperty({
    description: "ID da categoria do gasto",
    example: 1,
  })
  categoria_id: number;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: "Observações adicionais sobre o gasto variado",
    example: "Pizza de mussarela.",
  })
  observacoes?: string;
}

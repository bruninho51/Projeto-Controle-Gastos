import {
  IsString,
  IsOptional,
  IsDate,
  IsDecimal,
  IsInt,
  IsNotEmpty,
  ValidateIf,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";

export class GastoVariadoUpdateDto {
  @IsString()
  @IsNotEmpty()
  @ValidateIf((o) => o.descricao === null || !!o.descricao)
  @ApiProperty({
    description: "Descrição do gasto variado",
    example: "PIZZA",
  })
  descricao?: string;

  @IsDecimal()
  @IsNotEmpty()
  @ValidateIf((o) => o.valor === null || !!o.valor)
  @ApiProperty({
    description: "Valor",
    example: "130.00",
  })
  valor?: string;

  @IsOptional()
  @IsDate()
  @Transform(({ value }) => (value ? new Date(value) : null))
  @ApiProperty({
    description: "Data do pagamento",
    example: "2024-12-01",
  })
  data_pgto?: Date;

  @IsInt()
  @IsNotEmpty()
  @ValidateIf((o) => o.categoria_id === null || !!o.categoria_id)
  @ApiProperty({
    description: "ID da categoria do gasto",
    example: 1,
  })
  categoria_id?: number;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: "Observações adicionais sobre o gasto variado",
    example: "Pizza de mussarela.",
  })
  observacoes?: string;

  @IsDate()
  @IsOptional()
  @Transform(({ value }) => (value ? new Date(value) : null))
  @ApiProperty({
    description: "Inativar o gasto variado",
    example: "2024-12-01",
  })
  data_inatividade?: Date;
}

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
    required: false,
    nullable: true,
  })
  descricao?: string | null;

  @IsDecimal()
  @IsNotEmpty()
  @ValidateIf((o) => o.valor === null || !!o.valor)
  @ApiProperty({
    description: "Valor",
    example: "130.00",
    required: false,
    nullable: true,
  })
  valor?: string | null;

  @IsOptional()
  @IsDate()
  @Transform(({ value }) => (value ? new Date(value) : null))
  @ApiProperty({
    description: "Data do pagamento",
    example: "2024-12-01",
    required: false,
    nullable: true,
  })
  data_pgto?: Date | null;

  @IsInt()
  @IsNotEmpty()
  @ValidateIf((o) => o.categoria_id === null || !!o.categoria_id)
  @ApiProperty({
    description: "ID da categoria do gasto",
    example: 1,
    required: false,
    nullable: true,
  })
  categoria_id?: number | null;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: "Observações adicionais sobre o gasto variado",
    example: "Pizza de mussarela.",
    required: false,
    nullable: true,
  })
  observacoes?: string | null;

  @IsDate()
  @IsOptional()
  @Transform(({ value }) => (value ? new Date(value) : null))
  @ApiProperty({
    description: "Inativar o gasto variado",
    example: "2024-12-01",
    required: false,
    nullable: true,
  })
  data_inatividade?: Date | null;
}

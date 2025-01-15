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

export class GastoFixoUpdateDto {
  @IsString()
  @IsNotEmpty()
  @ValidateIf((o) => o.descricao === null || !!o.descricao)
  @ApiProperty({
    description: "Descrição do gasto fixo",
    example: "CONTA DE LUZ",
  })
  descricao?: string;

  @IsDecimal()
  @IsNotEmpty()
  @ValidateIf((o) => o.previsto === null || !!o.previsto)
  @ApiProperty({
    description: "Valor previsto",
    example: "130.00",
  })
  previsto?: string;

  @IsOptional()
  @IsDecimal()
  @ApiProperty({
    description: "Valor efetivamente pago",
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
    description: "Observações adicionais sobre o gasto fixo",
    example: "Pagar até o dia 20 desse mês.",
  })
  observacoes?: string;

  @IsOptional()
  @IsDate()
  @Transform(({ value }) => (value ? new Date(value) : null))
  @ApiProperty({
    description: "Inativar o gasto fixo",
    example: "2024-12-01",
  })
  data_inatividade?: Date;
}

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
    required: false,
    nullable: true,
  })
  descricao?: string | null;

  @IsDecimal()
  @IsNotEmpty()
  @ValidateIf((o) => o.previsto === null || !!o.previsto)
  @ApiProperty({
    description: "Valor previsto",
    example: "130.00",
    required: false,
    nullable: true,
  })
  previsto?: string | null;

  @IsOptional()
  @IsDecimal()
  @ApiProperty({
    description: "Valor efetivamente pago",
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

  @IsOptional()
  @IsDate()
  @Transform(({ value }) => (value ? new Date(value) : null))
  @ApiProperty({
    description: "Data de vencimento do gasto fixo",
    example: "2024-12-20",
    required: false,
    nullable: true,
  })
  data_venc?: Date | null;

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
    description: "Observações adicionais sobre o gasto fixo",
    example: "Pagar até o dia 20 desse mês.",
    required: false,
    nullable: true,
  })
  observacoes?: string | null;

  @IsOptional()
  @IsDate()
  @Transform(({ value }) => (value ? new Date(value) : null))
  @ApiProperty({
    description: "Inativar o gasto fixo",
    example: "2024-12-01",
    required: false,
    nullable: true,
  })
  data_inatividade?: Date | null;
}

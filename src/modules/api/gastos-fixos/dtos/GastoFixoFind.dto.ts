import {
  IsOptional,
  IsEnum,
  IsBoolean,
  IsDate,
  IsString,
} from "class-validator";
import { Transform, Type } from "class-transformer";
import { ApiPropertyOptional } from "@nestjs/swagger";

export enum StatusGasto {
  PAGO = "PAGO",
  NAO_PAGO = "NAO_PAGO",
}

export class GastoFixoFindDto {
  @ApiPropertyOptional({
    description: "Filtra pela descrição do gasto (busca parcial, contains)",
    example: "internet",
  })
  @IsOptional()
  @IsString()
  descricao?: string;

  @ApiPropertyOptional({
    description: "Status do gasto",
    enum: StatusGasto,
    example: StatusGasto.PAGO,
  })
  @IsOptional()
  @IsEnum(StatusGasto)
  status?: StatusGasto;

  @ApiPropertyOptional({
    description: "Data de pagamento exata",
    type: String,
    format: "date-time",
    example: "2026-02-10",
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  data_pgto?: Date;

  @ApiPropertyOptional({
    description: "Data inicial do intervalo de pagamento",
    type: String,
    format: "date-time",
    example: "2026-02-01",
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  data_pgto_inicio?: Date;

  @ApiPropertyOptional({
    description: "Data final do intervalo de pagamento",
    type: String,
    format: "date-time",
    example: "2026-02-28",
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  data_pgto_fim?: Date;

  @ApiPropertyOptional({
    description:
      "Filtra gastos vencidos (true = vencidos, false = não vencidos)",
    type: Boolean,
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined) return undefined;
    if (value === "true" || value === true) return true;
    if (value === "false" || value === false) return false;
    return value;
  })
  @IsBoolean({ message: "vencido deve ser true ou false" })
  vencido?: boolean;

  @ApiPropertyOptional({
    description: "Filtra pelo nome da categoria (busca parcial)",
    example: "Moradia",
  })
  @IsOptional()
  @IsString()
  nome_categoria?: string;
}

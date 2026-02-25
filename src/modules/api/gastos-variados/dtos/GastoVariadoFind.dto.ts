import { IsOptional, IsDate, IsString } from "class-validator";
import { Type } from "class-transformer";
import { ApiPropertyOptional } from "@nestjs/swagger";

export class GastoVariadoFindDto {
  @ApiPropertyOptional({
    description: "Filtra pela descrição do gasto (busca parcial, contains)",
    example: "internet",
  })
  @IsOptional()
  @IsString()
  descricao?: string;

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
    description: "Filtra pelo nome da categoria (busca parcial)",
    example: "Moradia",
  })
  @IsOptional()
  @IsString()
  nome_categoria?: string;
}

import { IsOptional, IsBoolean, IsString } from "class-validator";
import { Transform } from "class-transformer";
import { ApiPropertyOptional } from "@nestjs/swagger";

export class OrcamentoFindDto {
  @ApiPropertyOptional({
    description: "Filtra pelo nome do orçamento (busca parcial, contains)",
    example: "pessoal",
  })
  @IsOptional()
  @IsString()
  nome?: string;

  @ApiPropertyOptional({
    description:
      "Filtra orçamentos encerrados (true = encerrados, false = não encerrados)",
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
  @IsBoolean({ message: "encerrado deve ser true ou false" })
  encerrado?: boolean;

  @ApiPropertyOptional({
    description: "Filtra orçamentos inativos (true = inativos, false = ativos)",
    type: Boolean,
    example: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined) return undefined;
    if (value === "true" || value === true) return true;
    if (value === "false" || value === false) return false;
    return value;
  })
  @IsBoolean({ message: "inativo deve ser true ou false" })
  inativo?: boolean;
}

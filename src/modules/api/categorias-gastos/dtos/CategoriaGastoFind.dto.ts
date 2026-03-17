import { IsOptional, IsString } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";

export enum StatusGasto {
  PAGO = "PAGO",
  NAO_PAGO = "NAO_PAGO",
}

export class CategoriaGastoFindDto {
  @ApiPropertyOptional({
    description: "Filtra pelo nome da categoria (busca parcial, contains)",
    example: "internet",
  })
  @IsOptional()
  @IsString()
  nome?: string;
}

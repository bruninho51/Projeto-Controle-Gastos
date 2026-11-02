import { IsEnum, IsOptional, IsString } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { TipoCategoriaGasto } from "@prisma/client";

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

  @ApiPropertyOptional({
    description: "Filtra pelo tipo da categoria",
    enum: TipoCategoriaGasto,
    example: TipoCategoriaGasto.PATRIMONIO,
  })
  @IsOptional()
  @IsEnum(TipoCategoriaGasto)
  tipo?: TipoCategoriaGasto;
}

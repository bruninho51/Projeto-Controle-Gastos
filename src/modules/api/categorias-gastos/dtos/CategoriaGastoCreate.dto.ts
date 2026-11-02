import { IsString, IsNotEmpty, IsOptional, IsEnum } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { TipoCategoriaGasto } from "@prisma/client";

export class CategoriaGastoCreateDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: "Nome da categoria",
    example: "Alimentação",
  })
  nome: string;

  @IsOptional()
  @IsEnum(TipoCategoriaGasto)
  @ApiPropertyOptional({
    description:
      "Tipo da categoria. DESPESA é dinheiro que saiu; PATRIMONIO é dinheiro poupado, investido ou guardado.",
    enum: TipoCategoriaGasto,
    default: TipoCategoriaGasto.DESPESA,
    example: TipoCategoriaGasto.DESPESA,
  })
  tipo?: TipoCategoriaGasto;
}

import { IsOptional, IsString, IsEnum } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { InstituicaoFinanceira } from "@prisma/client";

export class PadraoNotificacaoBancariaFindDto {
  @ApiPropertyOptional({
    description: "Filtra pela instituição financeira",
    enum: InstituicaoFinanceira,
    example: InstituicaoFinanceira.ITAU,
  })
  @IsOptional()
  @IsEnum(InstituicaoFinanceira)
  instituicao_financeira?: InstituicaoFinanceira;

  @ApiPropertyOptional({
    description: "Filtra pelo título da notificação",
    example: "Compra aprovada",
  })
  @IsOptional()
  @IsString()
  titulo_notificacao?: string;
}

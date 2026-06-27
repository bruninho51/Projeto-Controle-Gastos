import { IsOptional, IsString } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";

export class PadraoNotificacaoBancariaFindDto {
  @ApiPropertyOptional({
    description: "Filtra pela instituição financeira",
    example: "Itaú",
  })
  @IsOptional()
  @IsString()
  instituicao_financeira?: string;

  @ApiPropertyOptional({
    description: "Filtra pelo título da notificação",
    example: "Compra aprovada",
  })
  @IsOptional()
  @IsString()
  titulo_notificacao?: string;
}

import { IsString, IsNotEmpty, IsEnum } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { InstituicaoFinanceira } from "@prisma/client";

export class PadraoNotificacaoBancariaCreateDto {
  @IsEnum(InstituicaoFinanceira)
  @ApiProperty({
    description: "Instituição financeira que enviou a notificação",
    enum: InstituicaoFinanceira,
    example: InstituicaoFinanceira.ITAU,
  })
  instituicao_financeira: InstituicaoFinanceira;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: "Título da notificação bancária",
    example: "Compra aprovada",
  })
  titulo_notificacao: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: "Corpo completo da notificação bancária",
    example: "Compra de R$ 59,90 em MERCADO SAO JOAO aprovada.",
  })
  corpo_notificacao: string;
}

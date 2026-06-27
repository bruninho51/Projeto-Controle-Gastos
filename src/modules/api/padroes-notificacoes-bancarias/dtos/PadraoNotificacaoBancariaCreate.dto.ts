import { IsString, IsNotEmpty } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class PadraoNotificacaoBancariaCreateDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: "Instituição financeira que enviou a notificação",
    example: "Itaú",
  })
  instituicao_financeira: string;

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

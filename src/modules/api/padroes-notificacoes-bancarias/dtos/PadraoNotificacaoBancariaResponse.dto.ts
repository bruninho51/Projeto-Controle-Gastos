import { ApiProperty } from "@nestjs/swagger";
import { PadraoNotificacaoBancaria } from "@prisma/client";
import { Exclude, Expose, plainToInstance } from "class-transformer";

@Exclude()
export class PadraoNotificacaoBancariaResponseDto {
  @Expose()
  @ApiProperty({
    example: 1,
    description: "Identificador do registro",
  })
  id: number;

  @Expose()
  @ApiProperty({
    example: "Itaú",
    description: "Instituição financeira que enviou a notificação",
  })
  instituicao_financeira: string;

  @Expose()
  @ApiProperty({
    example: "Compra aprovada",
    description: "Título da notificação bancária",
  })
  titulo_notificacao: string;

  @Expose()
  @ApiProperty({
    example:
      "Valor: R\\$(?<valor>[\\d,.]+).*Estabelecimento: (?<estabelecimento>.+)",
    description:
      "Expressão regular utilizada para extrair os dados da notificação",
  })
  regex: string;

  @Expose()
  @ApiProperty({
    example: "2026-06-27T21:31:27.000Z",
    description: "Data de criação do registro",
  })
  data_criacao: Date;

  @Expose()
  @ApiProperty({
    example: "2026-06-27T21:31:27.000Z",
    description: "Data da última atualização do registro",
  })
  data_atualizacao: Date;

  @Expose()
  @ApiProperty({
    example: "2026-07-27T21:31:27.000Z",
    description: "Data de expiração da regex",
  })
  data_expiracao: Date;

  constructor(partial: Partial<PadraoNotificacaoBancariaResponseDto>) {
    Object.assign(this, partial);
  }

  static fromEntity(
    entity: PadraoNotificacaoBancaria,
  ): PadraoNotificacaoBancariaResponseDto {
    return plainToInstance(
      PadraoNotificacaoBancariaResponseDto,
      {
        id: entity.id,
        instituicao_financeira: entity.instituicao_financeira,
        titulo_notificacao: entity.titulo_notificacao,
        regex: entity.regex,
        data_criacao: entity.data_criacao,
        data_atualizacao: entity.data_atualizacao,
        data_expiracao: entity.data_expiracao,
      },
      {
        excludeExtraneousValues: true,
      },
    );
  }
}

import { ApiProperty } from "@nestjs/swagger";
import { Orcamento } from "@prisma/client";
import { Exclude, Expose, plainToInstance } from "class-transformer";

@Exclude()
export class OrcamentoResponseDto {
  @Expose()
  @ApiProperty({ example: 1, description: "Identificador do orçamento" })
  id: number;

  @Expose()
  @ApiProperty({
    example: "Orçamento Pessoal",
    description: "Nome do orçamento",
  })
  nome: string;

  @Expose()
  @ApiProperty({
    example: "1000.00",
    description: "Valor inicial do orçamento",
  })
  valor_inicial: string;

  @Expose()
  @ApiProperty({ example: "1200.00", description: "Valor atual do orçamento" })
  valor_atual: string;

  @Expose()
  @ApiProperty({ example: "200.00", description: "Valor livre do orçamento" })
  valor_livre: string;

  @Expose()
  @ApiProperty({
    example: "2025-12-08T18:47:41.000Z",
    nullable: true,
    description: "Data de encerramento do orçamento",
  })
  data_encerramento: Date | null;

  @Expose()
  @ApiProperty({
    example: "2025-10-31T15:06:32.000Z",
    description: "Data de criação do registro",
  })
  data_criacao: Date;

  @Expose()
  @ApiProperty({
    example: "2025-12-08T18:47:41.000Z",
    nullable: true,
    description: "Data da última atualização do registro",
  })
  data_atualizacao: Date | null;

  @Expose()
  @ApiProperty({
    example: "2025-12-08T18:47:41.000Z",
    nullable: true,
    description: "Data de inatividade do registro",
  })
  data_inatividade: Date | null;

  constructor(partial: Partial<OrcamentoResponseDto>) {
    Object.assign(this, partial);
  }

  static fromEntity(entity: Orcamento | null): OrcamentoResponseDto | null {
    if (!entity) return null;

    return plainToInstance(
      OrcamentoResponseDto,
      {
        id: entity.id,
        nome: entity.nome,
        valor_inicial: entity.valor_inicial.toString(),
        valor_atual: entity.valor_atual.toString(),
        valor_livre: entity.valor_livre.toString(),
        data_encerramento: entity.data_encerramento,
        data_criacao: entity.data_criacao,
        data_atualizacao: entity.data_atualizacao,
        data_inatividade: entity.data_inatividade,
      },
      { excludeExtraneousValues: true },
    );
  }
}

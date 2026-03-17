import { ApiProperty } from "@nestjs/swagger";
import { CategoriaGasto, GastoFixo } from "@prisma/client";
import { Exclude, Expose, plainToInstance, Type } from "class-transformer";
import { CategoriaGastoResponseDto } from "../../categorias-gastos/dtos/CategoriaGastoResponse.dto";

type GastoFixoWithCategoria = GastoFixo & {
  categoriaGasto: CategoriaGasto;
};

@Exclude()
export class GastoFixoResponseDto {
  @Expose()
  @ApiProperty({ example: 261, description: "Identificador do gasto" })
  id: number;

  @Expose()
  @ApiProperty({
    example: "CONTA DE LUZ IPAVA",
    description: "Descrição do gasto",
  })
  descricao: string;

  @Expose()
  @ApiProperty({
    example: "320.00",
    description: "Valor previsto para o gasto",
  })
  previsto: string;

  @Expose()
  @ApiProperty({
    example: "281.34",
    nullable: true,
    description: "Valor efetivamente gasto",
  })
  valor: string | null;

  @Expose()
  @ApiProperty({
    example: 6,
    description: "Identificador da categoria do gasto",
  })
  categoria_id: number;

  @Expose()
  @ApiProperty({
    example: 39,
    description: "Identificador do orçamento relacionado",
  })
  orcamento_id: number;

  @Expose()
  @ApiProperty({
    example: "38.66",
    nullable: true,
    description: "Diferença entre previsto e valor",
  })
  diferenca: string | null;

  @Expose()
  @ApiProperty({
    example: "2025-12-02T00:00:00.000Z",
    nullable: true,
    description: "Data do pagamento",
  })
  data_pgto: Date | null;

  @Expose()
  @ApiProperty({
    example: "2025-12-10T00:00:00.000Z",
    nullable: true,
    description: "Data de vencimento do gasto",
  })
  data_venc: Date | null;

  @Expose()
  @ApiProperty({
    example: "Conta referente ao mês de dezembro",
    nullable: true,
    description: "Observações adicionais sobre o gasto",
  })
  observacoes: string | null;

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
    description: "Data em que o registro foi inativado",
  })
  data_inatividade: Date | null;

  @Expose()
  @Type(() => CategoriaGastoResponseDto)
  @ApiProperty({
    type: () => CategoriaGastoResponseDto,
    description: "Categoria do gasto",
  })
  categoriaGasto: CategoriaGastoResponseDto;

  constructor(partial: Partial<GastoFixoResponseDto>) {
    Object.assign(this, partial);
  }

  static fromEntity(
    entity: GastoFixoWithCategoria | null,
  ): GastoFixoResponseDto | null {
    if (!entity) return null;

    return plainToInstance(
      GastoFixoResponseDto,
      {
        id: entity.id,
        descricao: entity.descricao,
        previsto: entity.previsto.toString(),
        valor: entity.valor?.toString() ?? null,
        diferenca: entity.diferenca?.toString() ?? null,
        categoria_id: entity.categoria_id,
        orcamento_id: entity.orcamento_id,
        data_pgto: entity.data_pgto,
        data_venc: entity.data_venc,
        observacoes: entity.observacoes,
        data_criacao: entity.data_criacao,
        data_atualizacao: entity.data_atualizacao,
        data_inatividade: entity.data_inatividade,
        categoriaGasto: CategoriaGastoResponseDto.fromEntity(
          entity.categoriaGasto,
        ),
      },
      { excludeExtraneousValues: true },
    );
  }
}

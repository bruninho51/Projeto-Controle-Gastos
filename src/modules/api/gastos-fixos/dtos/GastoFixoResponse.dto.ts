import { ApiProperty } from "@nestjs/swagger";
import { GastoFixo } from "@prisma/client";
import { Exclude, Expose, plainToInstance } from "class-transformer";
import { CategoriaGastoResponseDto } from "../../categorias-gastos/dtos/CategoriaGastoResponse.dto";

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
  @ApiProperty({ example: "320", description: "Valor previsto para o gasto" })
  previsto: string;

  @Expose()
  @ApiProperty({ example: "281.34", description: "Valor efetivamente gasto" })
  valor: string;

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
    description: "Diferença entre previsto e valor",
  })
  diferenca: string;

  @Expose()
  @ApiProperty({
    example: "2025-12-02T00:00:00.000Z",
    description: "Data do pagamento",
  })
  data_pgto: Date;

  @Expose()
  @ApiProperty({
    example: null,
    required: false,
    nullable: true,
    description: "Data de vencimento do gasto",
  })
  data_venc?: Date | null;

  @Expose()
  @ApiProperty({
    example: null,
    required: false,
    nullable: true,
    description: "Observações adicionais sobre o gasto",
  })
  observacoes?: string | null;

  @Expose()
  @ApiProperty({
    example: "2025-10-31T15:06:32.000Z",
    description: "Data de criação do registro",
  })
  data_criacao: Date;

  @Expose()
  @ApiProperty({
    example: "2025-12-08T18:47:41.000Z",
    description: "Data da última atualização do registro",
  })
  data_atualizacao: Date;

  @Expose()
  @ApiProperty({
    example: null,
    required: false,
    nullable: true,
    description: "Data em que o registro foi inativado",
  })
  data_inatividade?: Date | null;

  @Expose()
  @ApiProperty({
    type: () => CategoriaGastoResponseDto,
    description: "Categoria do gasto",
  })
  categoriaGasto: CategoriaGastoResponseDto;

  constructor(partial: Partial<GastoFixoResponseDto>) {
    Object.assign(this, partial);
  }

  static fromEntity(
    entity: GastoFixo & { categoriaGasto: any },
  ): GastoFixoResponseDto {
    return plainToInstance(
      GastoFixoResponseDto,
      {
        id: entity.id,
        descricao: entity.descricao,
        previsto: entity.previsto,
        valor: entity.valor,
        categoria_id: entity.categoria_id,
        orcamento_id: entity.orcamento_id,
        diferenca: entity.diferenca,
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

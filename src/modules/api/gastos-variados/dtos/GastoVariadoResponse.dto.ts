import { ApiProperty } from "@nestjs/swagger";
import { GastoVariado, CategoriaGasto } from "@prisma/client";
import { Exclude, Expose, plainToInstance, Type } from "class-transformer";
import { CategoriaGastoResponseDto } from "../../categorias-gastos/dtos/CategoriaGastoResponse.dto";

type GastoVariadoWithCategoria = GastoVariado & { categoriaGasto: CategoriaGasto };

@Exclude()
export class GastoVariadoResponseDto {
  @Expose()
  @ApiProperty({ example: 1, description: "Identificador do gasto variado" })
  id: number;

  @Expose()
  @ApiProperty({ example: "Mercado", description: "Descrição do gasto variado" })
  descricao: string;

  @Expose()
  @ApiProperty({ example: "350.00", description: "Valor do gasto" })
  valor: string | null;

  @Expose()
  @ApiProperty({
    example: 1,
    description: "Identificador da categoria do gasto",
    required: false,
    nullable: true,
  })
  categoria_id: number | null;

  @Expose()
  @ApiProperty({
    example: 3,
    description: "Identificador do orçamento ao qual o gasto pertence",
    required: false,
    nullable: true,
  })
  orcamento_id: number | null;

  @Expose()
  @ApiProperty({
    example: "2025-05-08",
    description: "Data em que o gasto foi realizado",
    required: false,
    nullable: true,
  })
  data_pgto: Date | null;

  @Expose()
  @ApiProperty({
    example: "Compra no supermercado",
    description: "Observações sobre o gasto variado",
    required: false,
    nullable: true,
  })
  observacoes: string | null;

  @Expose()
  @ApiProperty({
    example: "2025-03-05T21:31:27.000Z",
    description: "Data de criação do registro",
  })
  data_criacao: Date | null;

  @Expose()
  @ApiProperty({
    example: "2025-03-05T21:31:27.000Z",
    description: "Data da última atualização do registro",
  })
  data_atualizacao: Date | null;

  @Expose()
  @ApiProperty({
    example: null,
    description: "Data em que o gasto foi inativado",
    required: false,
    nullable: true,
  })
  data_inatividade: Date | null;

  @Expose()
  @Type(() => CategoriaGastoResponseDto)
  @ApiProperty({
    type: () => CategoriaGastoResponseDto,
    description: "Categoria associada ao gasto variado",
    required: false,
    nullable: true,
  })
  categoriaGasto: CategoriaGastoResponseDto | null;

  constructor(partial: Partial<GastoVariadoResponseDto>) {
    Object.assign(this, partial);
  }

  static fromEntity(entity: GastoVariadoWithCategoria | null): GastoVariadoResponseDto | null {
    if (entity == null) return null;

    return plainToInstance(
      GastoVariadoResponseDto,
      {
        id: entity.id,
        descricao: entity.descricao,
        valor: entity.valor?.toString() ?? null,
        categoria_id: entity.categoria_id,
        orcamento_id: entity.orcamento_id,
        data_pgto: entity.data_pgto,
        observacoes: entity.observacoes,
        data_criacao: entity.data_criacao,
        data_atualizacao: entity.data_atualizacao,
        data_inatividade: entity.data_inatividade,
        categoriaGasto: CategoriaGastoResponseDto.fromEntity(entity.categoriaGasto)
      },
      { excludeExtraneousValues: true },
    );
  }
}
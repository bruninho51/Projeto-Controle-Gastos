import { IsString, IsOptional, IsDecimal, IsInt, IsDate } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class GastoVariadoCreateInputDto {
  @ApiProperty({
    description: 'Descrição do gasto variado',
    example: 'PIZZA',
  })
  @IsString()
  descricao: string;

  @ApiProperty({
    description: 'Valor',
    example: '130.00',
  })
  @IsDecimal()
  valor: string;

  @IsDate()
  @Transform(({ value }) => value ? new Date(value) : null)
  @ApiProperty({
    description: 'Data do pagamento',
    example: '2024-12-01',
  })
  data_pgto: Date;
  
  @ApiProperty({
    description: 'ID da categoria do gasto',
    example: 1,
  })
  @IsInt()
  categoria_id: number;

  @ApiProperty({
    description: 'Observações adicionais sobre o gasto variado',
    example: 'Pizza de mussarela.',
  })
  @IsOptional()
  @IsString()
  observacoes?: string;

}
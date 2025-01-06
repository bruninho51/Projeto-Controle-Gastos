import { IsString, IsOptional, IsDecimal, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GastoFixoCreateInputDto {
  @ApiProperty({
    description: 'Descrição do gasto fixo',
    example: 'CONTA DE LUZ',
  })
  @IsString()
  descricao: string;

  @ApiProperty({
    description: 'Valor previsto',
    example: '130.00',
  })
  @IsDecimal({ decimal_digits: '2' })
  previsto: string;
  
  @ApiProperty({
    description: 'ID da categoria do gasto',
    example: 1,
  })
  @IsInt()
  categoria_id: number;

  @ApiProperty({
    description: 'ID do orçamento',
    example: 1,
  })
  @IsInt()
  orcamento_id: number;

  @ApiProperty({
    description: 'Observações adicionais sobre o gasto fixo',
    example: 'Pagar até o dia 20 desse mês.',
  })
  @IsOptional()
  @IsString()
  observacoes?: string;

}
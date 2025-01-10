import { IsString, IsOptional, IsDecimal, IsInt, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GastoFixoCreateDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Descrição do gasto fixo',
    example: 'CONTA DE LUZ',
  })
  descricao: string;

  @IsDecimal()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Valor previsto',
    example: '130.00',
  })
  previsto: string;
  
  @IsInt()
  @IsNotEmpty()
  @ApiProperty({
    description: 'ID da categoria do gasto',
    example: 1,
  })
  categoria_id: number;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Observações adicionais sobre o gasto fixo',
    example: 'Pagar até o dia 20 desse mês.',
  })
  observacoes?: string;

}
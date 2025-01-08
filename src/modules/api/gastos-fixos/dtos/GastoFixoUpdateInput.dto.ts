import { IsString, IsOptional, IsDate, IsDecimal, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class GastoFixoUpdateInputDto {
  @ApiProperty({
    description: 'Descrição do gasto fixo',
    example: 'CONTA DE LUZ',
  })
  @IsOptional()
  @IsString()
  descricao?: string;

  @ApiProperty({
    description: 'Valor previsto',
    example: '130.00',
  })
  @IsOptional()
  @IsDecimal()
  previsto?: string;

  @ApiProperty({
    description: 'Valor efetivamente pago',
    example: '130.00',
  })
  @IsOptional()
  @IsDecimal({ decimal_digits: '2' })
  valor?: string;

  @IsDate()
  @IsOptional()
  @Transform(({ value }) => value ? new Date(value) : null)
  @ApiProperty({
    description: 'Data do pagamento',
    example: '2024-12-01',
  })
  data_pgto?: Date;
  
  @ApiProperty({
    description: 'ID da categoria do gasto',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  categoria_id?: number;

  @ApiProperty({
    description: 'ID do orçamento',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  orcamento_id?: number;

  @ApiProperty({
    description: 'Observações adicionais sobre o gasto fixo',
    example: 'Pagar até o dia 20 desse mês.',
  })
  @IsOptional()
  @IsString()
  observacoes?: string;

  @IsDate()
  @IsOptional()
  @Transform(({ value }) => value ? new Date(value) : null)
  @ApiProperty({
    description: 'Inativar o gasto fixo',
    example: '2024-12-01',
  })
  data_inatividade?: Date;
}
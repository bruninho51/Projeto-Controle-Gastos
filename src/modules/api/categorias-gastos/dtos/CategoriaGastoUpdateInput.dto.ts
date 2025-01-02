import { IsString, IsOptional, IsDate } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CategoriaGastoUpdateInputDto {
  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'Nome da categoria',
    example: 'Alimentação',
  })
  nome?: string;

  @IsDate()
  @IsOptional()
  @Transform(({ value }) => value ? new Date(value) : null)
  @ApiProperty({
    description: 'Inativar a categoria de gastos',
    example: '2024-12-01',
  })
  data_inatividade?: Date;
}
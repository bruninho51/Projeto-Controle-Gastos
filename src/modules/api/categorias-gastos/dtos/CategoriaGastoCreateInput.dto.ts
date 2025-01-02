import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CategoriaGastoCreateInputDto {
  @ApiProperty({
    description: 'Nome da categoria',
    example: 'Alimentação',
  })
  @IsString()
  nome: string;
}
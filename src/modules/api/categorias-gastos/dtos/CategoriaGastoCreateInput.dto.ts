import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CategoriaGastoCreateInputDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Nome da categoria',
    example: 'Alimentação',
  })
  nome: string;
}
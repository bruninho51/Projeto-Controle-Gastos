import { ApiProperty } from "@nestjs/swagger";
import { IsDecimal, IsNotEmpty, IsString } from "class-validator";

export class OrcamentoCreateDto {
    
    @IsString()
    @IsNotEmpty()
    @ApiProperty({
        description: 'Nome do orçamento',
        example: 'JANEIRO 2025',
      })
    nome: string;

    @IsDecimal()
    @IsNotEmpty()
    @ApiProperty({
        description: 'Valor inicial/salário',
        example: '2000.00',
      })
    valor_inicial: string;
}
import { ApiProperty } from "@nestjs/swagger";
import { IsDecimal, IsString } from "class-validator";

export class OrcamentoCreateInputDto {
    @IsString()
    @ApiProperty({
        description: 'Nome do orçamento',
        example: 'JANEIRO 2025',
      })
    nome: string;

    @IsDecimal({ decimal_digits: '2' })
    @ApiProperty({
        description: 'Valor inicial/salário',
        example: '2000.00',
      })
    valor_inicial: string;
}
import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsDate, IsDecimal, IsNotEmpty, IsOptional, IsString, ValidateIf } from "class-validator";

export class OrcamentoUpdateInputDto {
    @IsString()
    @IsNotEmpty()
    @ValidateIf(o => o.nome === null)
    @ApiProperty({
        description: 'Nome do orçamento',
        example: 'JANEIRO 2025',
      })
    nome?: string;

    @IsDecimal()
    @IsNotEmpty()
    @ValidateIf(o => o.valor_inicial === null)
    @ApiProperty({
        description: 'Valor inicial/salário',
        example: '2000.00',
      })
    valor_inicial?:string;

    @IsOptional()
    @IsDate()
    @Transform(({ value }) => value ? new Date(value) : null)
    @ApiProperty({
        description: 'Data de fechamento do orçamento',
        example: '2025-01-01',
      })
    data_encerramento?: Date;
    
    @IsOptional()
    @IsDate()
    @Transform(({ value }) => value ? new Date(value) : null)
    @ApiProperty({
        description: 'Inativar um registro de orçamento',
        example: '2024-12-01',
      })
    data_inatividade?: Date;
}
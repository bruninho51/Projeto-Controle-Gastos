import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsDate, IsDecimal, IsOptional, IsString } from "class-validator";

export class OrcamentoUpdateInputDto {
    @IsString()
    @IsOptional()
    @ApiProperty({
        description: 'Nome do orçamento',
        example: 'JANEIRO 2025',
      })
    nome?: string;

    @IsDecimal()
    @IsOptional()
    @ApiProperty({
        description: 'Valor inicial/salário',
        example: '2000.00',
      })
    valor_inicial?:string;

    @IsDate()
    @IsOptional()
    @Transform(({ value }) => value ? new Date(value) : null)
    @ApiProperty({
        description: 'Data de fechamento do orçamento',
        example: '2025-01-01',
      })
    data_encerramento?: Date;
    
    @IsDate()
    @IsOptional()
    @Transform(({ value }) => value ? new Date(value) : null)
    @ApiProperty({
        description: 'Inativar um registro de orçamento',
        example: '2024-12-01',
      })
    data_inatividade?: Date;
}
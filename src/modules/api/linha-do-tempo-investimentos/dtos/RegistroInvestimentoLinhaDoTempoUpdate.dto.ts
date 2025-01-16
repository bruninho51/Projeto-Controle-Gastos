import {
  IsOptional,
  IsDecimal,
  IsDate,
  IsNotEmpty,
  ValidateIf,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";

export class RegistroInvestimentoLinhaDoTempoUpdateDto {
    @IsDecimal()
    @IsNotEmpty()
    @ValidateIf((o) => o.valor === null || !!o.valor)
    @ApiProperty({
      description: "Valor do investimento no dia",
      example: "1300.00",
    })
    valor?: string;
  
    @IsOptional()
    @IsDate()
    @Transform(({ value }) => (value ? new Date(value) : null))
    @ApiProperty({
      description: "Dia em que o investimento esteve com o referido valor",
      example: "2024-12-01",
    })
    data_registro?: Date;
  
    @IsDate()
    @IsOptional()
    @Transform(({ value }) => (value ? new Date(value) : null))
    @ApiProperty({
      description: "Inativar o registro da linha do tempo do investimento",
      example: "2024-12-01",
    })
    data_inatividade?: Date;
}

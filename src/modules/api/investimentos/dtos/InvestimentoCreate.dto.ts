import { ApiProperty } from "@nestjs/swagger";
import { IsDecimal, IsInt, IsNotEmpty, IsString } from "class-validator";

export class InvestimentoCreateDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: "Nome do investimento",
    example: "Poupança",
  })
  nome: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: "Descrição do investimento",
    example: "Poupança Nubank",
  })
  descricao: string;

  @IsDecimal()
  @IsNotEmpty()
  @ApiProperty({
    description: "Aporte inicial do investimento",
    example: "2000.00",
  })
  valor_inicial: string;

  @IsInt()
  @IsNotEmpty()
  @ApiProperty({
    description: "ID da categoria do investimento",
    example: 1,
  })
  categoria_id: number;
}

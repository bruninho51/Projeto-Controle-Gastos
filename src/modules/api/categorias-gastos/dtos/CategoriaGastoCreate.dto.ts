import { IsString, IsNotEmpty } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CategoriaGastoCreateDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: "Nome da categoria",
    example: "Alimentação",
  })
  nome: string;
}

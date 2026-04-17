import {
  IsArray,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  ArrayMinSize,
} from "class-validator";

export class TokenDispositivoNotificacaoDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  tokens: string[];

  @IsString()
  @IsNotEmpty()
  titulo: string;

  @IsString()
  @IsNotEmpty()
  corpo: string;

  @IsOptional()
  @IsObject()
  dados?: Record<string, string>;
}

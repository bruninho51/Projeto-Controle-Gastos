import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, Matches } from "class-validator";

export class AuthCreateDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/, {
    message: "idToken deve estar no formato JWT (HEADER.PAYLOAD.SIGNATURE)",
  })
  @ApiProperty({
    example: "HEADER.PAYLOAD.SIGNATURE",
    description: "Firebase ID Token no formato JWT",
  })
  idToken: string;
}

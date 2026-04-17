import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class TokenDispositivoUpsertDto {
  @ApiProperty({
    example: "fcm-token-abc123",
    description: "Token do dispositivo (FCM, APNs, etc.)",
    maxLength: 512,
  })
  @MaxLength(512)
  @IsNotEmpty()
  @IsString()
  token: string;

  @ApiProperty({
    example: "android",
    description: "Plataforma do dispositivo (android, ios, web, etc.)",
  })
  @IsNotEmpty()
  @IsString()
  plataforma: string;
}

import { ApiProperty } from "@nestjs/swagger";
import { TokenDispositivo } from "@prisma/client";

export class TokenDispositivoResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: "fcm-token-abc123" })
  token: string;

  @ApiProperty({ example: 1 })
  usuario_id: number;

  @ApiProperty({ example: "android" })
  plataforma: string;

  @ApiProperty({ example: "2024-01-01T00:00:00.000Z", nullable: true })
  data_criacao: Date | null;

  @ApiProperty({ example: "2024-01-01T00:00:00.000Z", nullable: true })
  data_atualizacao: Date | null;

  static fromEntity(entity: TokenDispositivo): TokenDispositivoResponseDto {
    if (!entity) return null;

    const dto = new TokenDispositivoResponseDto();
    dto.id = entity.id;
    dto.token = entity.token;
    dto.usuario_id = entity.usuario_id;
    dto.plataforma = entity.plataforma;
    dto.data_criacao = entity.data_criacao;
    dto.data_atualizacao = entity.data_atualizacao;
    return dto;
  }
}
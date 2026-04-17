import { Inject, Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { TokenDispositivoUpsertDto } from "./dtos/TokenDispositivoUpsert.dto";
import { TokenDispositivoResponseDto } from "./dtos/TokenDispositivoResponse.dto";

@Injectable()
export class TokensDispositivosService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async upsert(
    usuario_id: number,
    upsertDto: TokenDispositivoUpsertDto,
  ): Promise<TokenDispositivoResponseDto> {
    const token = await this.prisma.tokenDispositivo.upsert({
      where: { token: upsertDto.token },
      update: {
        usuario_id,
        plataforma: upsertDto.plataforma,
        data_atualizacao: new Date(),
      },
      create: {
        token: upsertDto.token,
        usuario_id,
        plataforma: upsertDto.plataforma,
      },
    });

    return TokenDispositivoResponseDto.fromEntity(token);
  }

  async findAll(usuario_id: number): Promise<TokenDispositivoResponseDto[]> {
    const tokens = await this.prisma.tokenDispositivo.findMany({
      where: { usuario_id },
    });

    return tokens.map((t) => TokenDispositivoResponseDto.fromEntity(t));
  }

  async findOne(
    usuario_id: number,
    id: number,
  ): Promise<TokenDispositivoResponseDto | null> {
    const token = await this.prisma.tokenDispositivo.findUnique({
      where: { id, usuario_id },
    });

    return TokenDispositivoResponseDto.fromEntity(token);
  }

  async remove(
    usuario_id: number,
    id: number,
  ): Promise<TokenDispositivoResponseDto> {
    const token = await this.prisma.tokenDispositivo.delete({
      where: { id, usuario_id },
    });

    return TokenDispositivoResponseDto.fromEntity(token);
  }
}

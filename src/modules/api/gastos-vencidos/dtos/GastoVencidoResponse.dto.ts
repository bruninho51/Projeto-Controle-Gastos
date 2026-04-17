import { ApiProperty } from "@nestjs/swagger";
import {
  GastoFixo,
  Orcamento,
  TokenDispositivo,
  Usuario,
} from "@prisma/client";
import { Exclude, Expose, plainToInstance } from "class-transformer";

export type GastoVencidoComUsuario = GastoFixo & {
  orcamento: Orcamento & {
    usuario: Usuario & {
      tokenDispositivos: TokenDispositivo[];
    };
  };
};

@Exclude()
export class TokenDispositivoDto {
  @Expose()
  @ApiProperty({ example: 1 })
  id: number;

  @Expose()
  @ApiProperty({ example: "fcm-token-abc123" })
  token: string;

  @Expose()
  @ApiProperty({ example: "android" })
  plataforma: string;
}

@Exclude()
export class UsuarioGastoVencidoDto {
  @Expose()
  @ApiProperty({ example: 1 })
  id: number;

  @Expose()
  @ApiProperty({ example: "João Silva" })
  nome: string;

  @Expose()
  @ApiProperty({ example: "joao@email.com" })
  email: string;

  @Expose()
  @ApiProperty({ type: () => [TokenDispositivoDto] })
  tokenDispositivos: TokenDispositivoDto[];
}

@Exclude()
export class OrcamentoGastoVencidoDto {
  @Expose()
  @ApiProperty({ example: 1 })
  id: number;

  @Expose()
  @ApiProperty({ example: "Orçamento Janeiro" })
  nome: string;

  @Expose()
  @ApiProperty({ type: () => UsuarioGastoVencidoDto })
  usuario: UsuarioGastoVencidoDto;
}

@Exclude()
export class GastoVencidoResponseDto {
  @Expose()
  @ApiProperty({ example: 1 })
  id: number;

  @Expose()
  @ApiProperty({ example: "Internet" })
  descricao: string;

  @Expose()
  @ApiProperty({ example: "150.00" })
  previsto: string;

  @Expose()
  @ApiProperty({ example: "2026-04-20T00:00:00.000Z", nullable: true })
  data_venc: Date | null;

  @Expose()
  @ApiProperty({ example: "2025-03-05T21:31:27.000Z", nullable: true })
  data_criacao: Date | null;

  @Expose()
  @ApiProperty({ example: "2025-03-05T21:31:27.000Z", nullable: true })
  data_atualizacao: Date | null;

  @Expose()
  @ApiProperty({ type: () => OrcamentoGastoVencidoDto })
  orcamento: OrcamentoGastoVencidoDto;

  constructor(partial: Partial<GastoVencidoResponseDto>) {
    Object.assign(this, partial);
  }

  static fromEntity(entity: GastoVencidoComUsuario): GastoVencidoResponseDto {
    return plainToInstance(
      GastoVencidoResponseDto,
      {
        id: entity.id,
        descricao: entity.descricao,
        previsto: entity.previsto?.toString() ?? null,
        data_venc: entity.data_venc,
        data_criacao: entity.data_criacao,
        data_atualizacao: entity.data_atualizacao,
        orcamento: {
          id: entity.orcamento.id,
          nome: entity.orcamento.nome,
          usuario: {
            id: entity.orcamento.usuario.id,
            nome: entity.orcamento.usuario.nome,
            email: entity.orcamento.usuario.email,
            tokenDispositivos: entity.orcamento.usuario.tokenDispositivos.map(
              (t) => ({
                id: t.id,
                token: t.token,
                plataforma: t.plataforma,
              }),
            ),
          },
        },
      },
      { excludeExtraneousValues: true },
    );
  }
}

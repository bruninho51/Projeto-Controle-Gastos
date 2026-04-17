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
  id: number;

  @Expose()
  token: string;

  @Expose()
  plataforma: string;
}

@Exclude()
export class UsuarioGastoVencidoDto {
  @Expose()
  @ApiProperty({ example: 1 })
  id: number;

  @Expose()
  nome: string;

  @Expose()
  email: string;

  @Expose()
  tokenDispositivos: TokenDispositivoDto[];
}

@Exclude()
export class OrcamentoGastoVencidoDto {
  @Expose()
  id: number;

  @Expose()
  nome: string;

  @Expose()
  usuario: UsuarioGastoVencidoDto;
}

@Exclude()
export class GastoVencidoResponseDto {
  @Expose()
  id: number;

  @Expose()
  descricao: string;

  @Expose()
  previsto: string;

  @Expose()
  data_venc: Date | null;

  @Expose()
  data_criacao: Date | null;

  @Expose()
  data_atualizacao: Date | null;

  @Expose()
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

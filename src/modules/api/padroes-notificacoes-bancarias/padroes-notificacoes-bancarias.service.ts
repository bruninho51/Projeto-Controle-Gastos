import {
  BadGatewayException,
  Inject,
  Injectable,
  Logger,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { GeminiService } from "../../gemini/gemini.service";
import { PadraoNotificacaoBancariaCreateDto } from "./dtos/PadraoNotificacaoBancariaCreate.dto";
import { PadraoNotificacaoBancariaFindDto } from "./dtos/PadraoNotificacaoBancariaFind.dto";
import { PadraoNotificacaoBancariaResponseDto } from "./dtos/PadraoNotificacaoBancariaResponse.dto";

const VALIDADE_PADRAO_DIAS = 30;
const MAX_TENTATIVAS_GERACAO_REGEX = 3;

@Injectable()
export class PadroesNotificacoesBancariasService {
  private readonly logger = new Logger(
    PadroesNotificacoesBancariasService.name,
  );

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    private readonly geminiService: GeminiService,
  ) {}

  async obterOuGerar(
    createDto: PadraoNotificacaoBancariaCreateDto,
  ): Promise<PadraoNotificacaoBancariaResponseDto> {
    const { instituicao_financeira, titulo_notificacao, corpo_notificacao } =
      createDto;

    const existente = await this.prisma.padraoNotificacaoBancaria.findUnique({
      where: {
        instituicao_titulo_unique: {
          instituicao_financeira,
          titulo_notificacao,
        },
      },
    });

    if (existente && existente.data_expiracao > new Date()) {
      return PadraoNotificacaoBancariaResponseDto.fromEntity(existente);
    }

    const regex = await this.gerarRegexComRetentativas(
      titulo_notificacao,
      corpo_notificacao,
    );

    const registro = await this.prisma.padraoNotificacaoBancaria.upsert({
      where: {
        instituicao_titulo_unique: {
          instituicao_financeira,
          titulo_notificacao,
        },
      },
      update: {
        regex,
        data_atualizacao: new Date(),
        data_expiracao: this.calcularDataExpiracao(),
      },
      create: {
        instituicao_financeira,
        titulo_notificacao,
        regex,
        data_expiracao: this.calcularDataExpiracao(),
      },
    });

    return PadraoNotificacaoBancariaResponseDto.fromEntity(registro);
  }

  async findAll(
    filters: PadraoNotificacaoBancariaFindDto,
  ): Promise<PadraoNotificacaoBancariaResponseDto[]> {
    const registros = await this.prisma.padraoNotificacaoBancaria.findMany({
      where: this.buildWhere(filters),
    });

    return registros.map((r) =>
      PadraoNotificacaoBancariaResponseDto.fromEntity(r),
    );
  }

  /**
   * Solicita ao Gemini uma regex válida, tentando novamente em caso de falha
   * (regex sintaticamente inválida, sem os grupos nomeados obrigatórios, etc.).
   * Nenhuma regex é persistida até que uma tentativa seja bem-sucedida.
   */
  private async gerarRegexComRetentativas(
    titulo: string,
    corpo: string,
  ): Promise<string> {
    let ultimaMensagemErro = "erro desconhecido";

    for (
      let tentativa = 1;
      tentativa <= MAX_TENTATIVAS_GERACAO_REGEX;
      tentativa++
    ) {
      try {
        return await this.geminiService.gerarRegexNotificacao(titulo, corpo);
      } catch (error) {
        ultimaMensagemErro =
          error instanceof Error ? error.message : String(error);
        this.logger.warn(
          `Tentativa ${tentativa}/${MAX_TENTATIVAS_GERACAO_REGEX} de geração de regex falhou: ${ultimaMensagemErro}`,
        );
      }
    }

    throw new BadGatewayException(
      `Não foi possível gerar uma regex válida após ${MAX_TENTATIVAS_GERACAO_REGEX} tentativas: ${ultimaMensagemErro}`,
    );
  }

  private buildWhere(
    filters: PadraoNotificacaoBancariaFindDto,
  ): Prisma.PadraoNotificacaoBancariaWhereInput {
    const where: Prisma.PadraoNotificacaoBancariaWhereInput = {};

    if (filters.instituicao_financeira) {
      where.instituicao_financeira = filters.instituicao_financeira;
    }

    if (filters.titulo_notificacao) {
      where.titulo_notificacao = filters.titulo_notificacao;
    }

    return where;
  }

  private calcularDataExpiracao(): Date {
    const validadeDias = parseInt(
      process.env.REGEX_NOTIFICACAO_VALIDADE_DIAS ?? "",
      10,
    );

    const dias = Number.isNaN(validadeDias)
      ? VALIDADE_PADRAO_DIAS
      : validadeDias;

    const dataExpiracao = new Date();
    dataExpiracao.setDate(dataExpiracao.getDate() + dias);

    return dataExpiracao;
  }
}

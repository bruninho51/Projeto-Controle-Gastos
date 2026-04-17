import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { TokensDispositivosNotificacaoService } from "../tokens-dispositivos/tokens-dispositivos-notificacao.service";
import { TokenDispositivoNotificacaoDto } from "../tokens-dispositivos/dtos/TokenDispositivoNotificacao.dto";
import { GastosVencidosService } from "./gastos-vencidos.service";
import { GastoVencidoResponseDto } from "./dtos/GastoVencidoResponse.dto";

const MS_POR_DIA = 1000 * 60 * 60 * 24;

@Injectable()
export class GastosVencidosScheduler {
  private readonly logger = new Logger(GastosVencidosScheduler.name);

  constructor(
    private readonly gastosVencidosService: GastosVencidosService,
    private readonly tokensDispositivosNotificacaoService: TokensDispositivosNotificacaoService,
  ) {}

  @Cron("0 8,13,19 * * *")
  async notificarGastosVencidos() {
    this.logger.log("Verificando gastos vencidos...");

    const gastos = await this.gastosVencidosService.findGastosAVencer();

    if (!gastos.length) {
      this.logger.log("Nenhum gasto vencido encontrado.");
      return;
    }

    for (const gasto of gastos) {
      const tokens = gasto.orcamento.usuario.tokenDispositivos.map(
        (t) => t.token,
      );
      if (!tokens.length) continue;

      const notificacao = this.buildNotificacao(gasto, tokens);
      await this.tokensDispositivosNotificacaoService.enviar(notificacao);
    }

    this.logger.log(`${gastos.length} gastos vencidos notificados.`);
  }

  private buildNotificacao(
    gasto: GastoVencidoResponseDto,
    tokens: string[],
  ): TokenDispositivoNotificacaoDto {
    const diffDias = this.calcularDiffDias(new Date(gasto.data_venc));
    const dataFormatada = this.formatarData(new Date(gasto.data_venc));
    const valorFormatado = this.formatarValor(gasto.previsto);
    const { titulo, corpo } = this.buildMensagem(
      gasto,
      diffDias,
      dataFormatada,
      valorFormatado,
    );

    const notificacao = new TokenDispositivoNotificacaoDto();
    notificacao.tokens = tokens;
    notificacao.titulo = titulo;
    notificacao.corpo = corpo;
    notificacao.dados = {
      gasto_id: gasto.id.toString(),
      orcamento_id: gasto.orcamento.id.toString(),
    };

    return notificacao;
  }

  private buildMensagem(
    gasto: GastoVencidoResponseDto,
    diffDias: number,
    dataFormatada: string,
    valorFormatado: string,
  ): { titulo: string; corpo: string } {
    const descricao = gasto.descricao;
    const orcamento = gasto.orcamento.nome;

    if (diffDias < 0) {
      const diasAtraso = Math.abs(diffDias);
      const atraso = diasAtraso === 1 ? "1 dia" : `${diasAtraso} dias`;
      return {
        titulo: "⚠️ Pagamento em atraso!",
        corpo: `⚠️ O gasto "${descricao}" no valor de ${valorFormatado} do orçamento "${orcamento}" está em atraso há ${atraso}. Venceu em ${dataFormatada} e ainda não foi pago.`,
      };
    }

    if (diffDias === 0) {
      return {
        titulo: "🚨 Pagamento vence hoje!",
        corpo: `🚨 O gasto "${descricao}" no valor de ${valorFormatado} do orçamento "${orcamento}" vence hoje. Efetue o pagamento para evitar atraso.`,
      };
    }

    if (diffDias <= 7) {
      const diaDaSemana = this.formatarDiaDaSemana(new Date(gasto.data_venc));
      return {
        titulo: "🔔 Pagamento próximo do vencimento!",
        corpo: `🔔 O gasto "${descricao}" no valor de ${valorFormatado} do orçamento "${orcamento}" vence ${diaDaSemana}, dia ${dataFormatada}. Não deixe passar!`,
      };
    }

    return {
      titulo: "🔔 Lembrete de pagamento",
      corpo: `🔔 O gasto "${descricao}" no valor de ${valorFormatado} do orçamento "${orcamento}" vencerá em ${dataFormatada}. Organize-se para efetuar o pagamento no prazo.`,
    };
  }

  private calcularDiffDias(dataVenc: Date): number {
    const venc = new Date(dataVenc);
    venc.setUTCHours(0, 0, 0, 0);

    const hoje = new Date();
    hoje.setUTCHours(0, 0, 0, 0);

    return Math.round((venc.getTime() - hoje.getTime()) / MS_POR_DIA);
  }

  private formatarData(data: Date): string {
    return data.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: "UTC",
    });
  }

  private formatarDiaDaSemana(data: Date): string {
    const dia = data.toLocaleDateString("pt-BR", {
      weekday: "long",
      timeZone: "UTC",
    });
    return dia.charAt(0).toUpperCase() + dia.slice(1);
  }

  private formatarValor(valor: string): string {
    return parseFloat(valor).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }
}

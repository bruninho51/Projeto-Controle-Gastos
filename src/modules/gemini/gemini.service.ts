import { BadGatewayException, Injectable, Logger } from "@nestjs/common";

interface GeminiGenerateContentResponse {
  candidates?: {
    content?: {
      parts?: { text?: string }[];
    };
  }[];
}

const GRUPOS_OBRIGATORIOS = ["valor", "estabelecimento"];

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);

  async gerarRegexNotificacao(titulo: string, corpo: string): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY;
    const model = process.env.GEMINI_MODEL ?? "gemini-2.0-flash";

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: this.buildPrompt(titulo, corpo) }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: { regex: { type: "STRING" } },
            required: ["regex"],
          },
        },
      }),
    }).catch((error) => {
      this.logger.error(`Falha ao chamar a API do Gemini: ${error.message}`);
      throw new BadGatewayException(
        "Não foi possível se comunicar com o serviço de geração de regex.",
      );
    });

    if (!response.ok) {
      this.logger.error(
        `API do Gemini retornou status ${response.status}: ${await response.text()}`,
      );
      throw new BadGatewayException(
        "O serviço de geração de regex retornou um erro.",
      );
    }

    const body: GeminiGenerateContentResponse = await response.json();
    const regex = this.extrairRegex(body);

    this.validarRegex(regex);

    return regex;
  }

  private buildPrompt(titulo: string, corpo: string): string {
    return `Você é um especialista em expressões regulares para JavaScript.
Analise o título e o corpo de uma notificação bancária abaixo e gere uma única expressão regular, compatível com o motor de regex do JavaScript (ECMA), capaz de extrair as seguintes informações da notificação:
- valor: o valor monetário da transação.
- estabelecimento: o nome do estabelecimento ou recebedor da transação.

A expressão regular DEVE conter obrigatoriamente os grupos de captura nomeados "valor" e "estabelecimento", no formato (?<valor>...) e (?<estabelecimento>...).

Título: "${titulo}"
Corpo: "${corpo}"

Responda apenas com o JSON solicitado, sem nenhum texto adicional.`;
  }

  private extrairRegex(body: GeminiGenerateContentResponse): string {
    const text = body.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new BadGatewayException(
        "O serviço de geração de regex retornou uma resposta vazia.",
      );
    }

    try {
      const parsed = JSON.parse(text);
      if (typeof parsed.regex !== "string" || !parsed.regex) {
        throw new Error("Campo regex ausente ou inválido");
      }
      return parsed.regex;
    } catch (error) {
      this.logger.error(
        `Falha ao interpretar a resposta do Gemini: ${error['message']}`,
      );
      throw new BadGatewayException(
        "O serviço de geração de regex retornou uma resposta em formato inválido.",
      );
    }
  }

  private validarRegex(regex: string): void {
    const gruposFaltantes = GRUPOS_OBRIGATORIOS.filter(
      (grupo) => !regex.includes(`(?<${grupo}>`),
    );

    if (gruposFaltantes.length) {
      throw new BadGatewayException(
        `A regex gerada não contém os grupos nomeados obrigatórios: ${gruposFaltantes.join(", ")}.`,
      );
    }

    try {
      new RegExp(regex);
    } catch {
      throw new BadGatewayException(
        "A regex gerada não é sintaticamente válida.",
      );
    }
  }
}

import { Test, TestingModule } from "@nestjs/testing";
import { BadGatewayException } from "@nestjs/common";
import { PadroesNotificacoesBancariasService } from "./padroes-notificacoes-bancarias.service";
import { PrismaService } from "../../prisma/prisma.service";
import { GeminiService } from "../../gemini/gemini.service";
import {
  InstituicaoFinanceira,
  PadraoNotificacaoBancaria,
} from "@prisma/client";
import { faker } from "@faker-js/faker";
import { PadraoNotificacaoBancariaCreateDto } from "./dtos/PadraoNotificacaoBancariaCreate.dto";
import { PadraoNotificacaoBancariaFindDto } from "./dtos/PadraoNotificacaoBancariaFind.dto";

describe("PadraoNotificacoesBancariasService", () => {
  let service: PadroesNotificacoesBancariasService;

  const prismaServiceMock = {
    padraoNotificacaoBancaria: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      upsert: jest.fn(),
    },
  };

  const geminiServiceMock = {
    gerarRegexNotificacao: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PadroesNotificacoesBancariasService,
        { provide: PrismaService, useValue: prismaServiceMock },
        { provide: GeminiService, useValue: geminiServiceMock },
      ],
    }).compile();

    service = module.get<PadroesNotificacoesBancariasService>(
      PadroesNotificacoesBancariasService,
    );
  });

  function buildRegistro(
    overrides: Partial<PadraoNotificacaoBancaria> = {},
  ): PadraoNotificacaoBancaria {
    const now = new Date();
    return {
      id: faker.number.int(),
      instituicao_financeira: InstituicaoFinanceira.ITAU,
      titulo_notificacao: "Compra aprovada",
      regex: "(?<valor>[\\d,.]+).*(?<estabelecimento>.+)",
      data_criacao: now,
      data_atualizacao: now,
      data_expiracao: new Date(now.getTime() + 1000 * 60 * 60 * 24),
      soft_delete: null,
      ...overrides,
    };
  }

  describe("obterOuGerar", () => {
    const createDto: PadraoNotificacaoBancariaCreateDto = {
      instituicao_financeira: InstituicaoFinanceira.ITAU,
      titulo_notificacao: "Compra aprovada",
      corpo_notificacao: "Compra de R$ 59,90 em MERCADO SAO JOAO aprovada.",
    };

    it("should return the existing regex without calling Gemini when it is still valid", async () => {
      const existente = buildRegistro();
      prismaServiceMock.padraoNotificacaoBancaria.findUnique.mockResolvedValue(
        existente,
      );

      const resultado = await service.obterOuGerar(createDto);

      expect(resultado.regex).toBe(existente.regex);
      expect(geminiServiceMock.gerarRegexNotificacao).not.toHaveBeenCalled();
      expect(
        prismaServiceMock.padraoNotificacaoBancaria.upsert,
      ).not.toHaveBeenCalled();
      expect(
        prismaServiceMock.padraoNotificacaoBancaria.findUnique,
      ).toHaveBeenCalledWith({
        where: {
          instituicao_titulo_unique: {
            instituicao_financeira: createDto.instituicao_financeira,
            titulo_notificacao: createDto.titulo_notificacao,
          },
        },
      });
    });

    it("should generate a new regex with Gemini when no record exists", async () => {
      prismaServiceMock.padraoNotificacaoBancaria.findUnique.mockResolvedValue(
        null,
      );

      const novaRegex = "(?<valor>[\\d,.]+).*(?<estabelecimento>.+)";
      geminiServiceMock.gerarRegexNotificacao.mockResolvedValue(novaRegex);

      const registroCriado = buildRegistro({ regex: novaRegex });
      prismaServiceMock.padraoNotificacaoBancaria.upsert.mockResolvedValue(
        registroCriado,
      );

      const resultado = await service.obterOuGerar(createDto);

      expect(geminiServiceMock.gerarRegexNotificacao).toHaveBeenCalledWith(
        createDto.titulo_notificacao,
        createDto.corpo_notificacao,
      );
      expect(resultado.regex).toBe(novaRegex);

      const upsertArgs =
        prismaServiceMock.padraoNotificacaoBancaria.upsert.mock.calls[0][0];
      expect(upsertArgs.where).toEqual({
        instituicao_titulo_unique: {
          instituicao_financeira: createDto.instituicao_financeira,
          titulo_notificacao: createDto.titulo_notificacao,
        },
      });
      expect(upsertArgs.create).toMatchObject({
        instituicao_financeira: createDto.instituicao_financeira,
        titulo_notificacao: createDto.titulo_notificacao,
        regex: novaRegex,
      });
      expect(upsertArgs.create.data_expiracao).toBeInstanceOf(Date);
    });

    it("should generate a new regex with Gemini when the existing record is expired", async () => {
      const existenteExpirado = buildRegistro({
        data_expiracao: new Date(Date.now() - 1000 * 60 * 60 * 24),
      });
      prismaServiceMock.padraoNotificacaoBancaria.findUnique.mockResolvedValue(
        existenteExpirado,
      );

      const novaRegex = "(?<valor>[\\d,.]+).*(?<estabelecimento>.+)";
      geminiServiceMock.gerarRegexNotificacao.mockResolvedValue(novaRegex);

      const registroAtualizado = buildRegistro({
        id: existenteExpirado.id,
        regex: novaRegex,
      });
      prismaServiceMock.padraoNotificacaoBancaria.upsert.mockResolvedValue(
        registroAtualizado,
      );

      const resultado = await service.obterOuGerar(createDto);

      expect(geminiServiceMock.gerarRegexNotificacao).toHaveBeenCalled();
      expect(resultado.id).toBe(existenteExpirado.id);
      expect(resultado.regex).toBe(novaRegex);
    });

    it("should update the expired record instead of duplicating it", async () => {
      const existenteExpirado = buildRegistro({
        data_expiracao: new Date(Date.now() - 1000 * 60 * 60 * 24),
      });
      prismaServiceMock.padraoNotificacaoBancaria.findUnique.mockResolvedValue(
        existenteExpirado,
      );

      geminiServiceMock.gerarRegexNotificacao.mockResolvedValue(
        "(?<valor>.+).*(?<estabelecimento>.+)",
      );
      prismaServiceMock.padraoNotificacaoBancaria.upsert.mockResolvedValue(
        buildRegistro({ id: existenteExpirado.id }),
      );

      await service.obterOuGerar(createDto);

      const upsertArgs =
        prismaServiceMock.padraoNotificacaoBancaria.upsert.mock.calls[0][0];
      expect(upsertArgs.update).toMatchObject({
        regex: "(?<valor>.+).*(?<estabelecimento>.+)",
      });
      expect(upsertArgs.update.data_expiracao).toBeInstanceOf(Date);
      expect(upsertArgs.update.data_atualizacao).toBeInstanceOf(Date);
    });

    it("should not create duplicate records, relying on a single upsert by the unique key", async () => {
      prismaServiceMock.padraoNotificacaoBancaria.findUnique.mockResolvedValue(
        null,
      );
      geminiServiceMock.gerarRegexNotificacao.mockResolvedValue(
        "(?<valor>.+).*(?<estabelecimento>.+)",
      );
      prismaServiceMock.padraoNotificacaoBancaria.upsert.mockResolvedValue(
        buildRegistro(),
      );

      await service.obterOuGerar(createDto);

      expect(
        prismaServiceMock.padraoNotificacaoBancaria.upsert,
      ).toHaveBeenCalledTimes(1);
    });

    describe("retentativas de geração de regex", () => {
      beforeEach(() => {
        prismaServiceMock.padraoNotificacaoBancaria.findUnique.mockResolvedValue(
          null,
        );
      });

      it("should generate a valid regex on the first attempt", async () => {
        const regexValida = "(?<valor>[\\d,.]+).*(?<estabelecimento>.+)";
        geminiServiceMock.gerarRegexNotificacao.mockResolvedValue(regexValida);
        prismaServiceMock.padraoNotificacaoBancaria.upsert.mockResolvedValue(
          buildRegistro({ regex: regexValida }),
        );

        const resultado = await service.obterOuGerar(createDto);

        expect(resultado.regex).toBe(regexValida);
        expect(geminiServiceMock.gerarRegexNotificacao).toHaveBeenCalledTimes(
          1,
        );
      });

      it("should retry and persist the regex when the first attempt fails and the second succeeds", async () => {
        const regexValida = "(?<valor>[\\d,.]+).*(?<estabelecimento>.+)";
        geminiServiceMock.gerarRegexNotificacao
          .mockRejectedValueOnce(new BadGatewayException("regex inválida"))
          .mockResolvedValueOnce(regexValida);
        prismaServiceMock.padraoNotificacaoBancaria.upsert.mockResolvedValue(
          buildRegistro({ regex: regexValida }),
        );

        const resultado = await service.obterOuGerar(createDto);

        expect(resultado.regex).toBe(regexValida);
        expect(geminiServiceMock.gerarRegexNotificacao).toHaveBeenCalledTimes(
          2,
        );
        expect(
          prismaServiceMock.padraoNotificacaoBancaria.upsert,
        ).toHaveBeenCalledTimes(1);
        expect(
          prismaServiceMock.padraoNotificacaoBancaria.upsert.mock.calls[0][0]
            .create.regex,
        ).toBe(regexValida);
      });

      it("should throw an exception after 3 failed attempts and not persist anything", async () => {
        geminiServiceMock.gerarRegexNotificacao.mockRejectedValue(
          new BadGatewayException("regex inválida"),
        );

        await expect(service.obterOuGerar(createDto)).rejects.toThrow(
          BadGatewayException,
        );

        expect(geminiServiceMock.gerarRegexNotificacao).toHaveBeenCalledTimes(
          3,
        );
        expect(
          prismaServiceMock.padraoNotificacaoBancaria.upsert,
        ).not.toHaveBeenCalled();
      });
    });
  });

  describe("findAll", () => {
    function getLastFindManyWhere() {
      const calls =
        prismaServiceMock.padraoNotificacaoBancaria.findMany.mock.calls;
      return calls[calls.length - 1][0].where;
    }

    async function findAllWhere(filters: PadraoNotificacaoBancariaFindDto) {
      prismaServiceMock.padraoNotificacaoBancaria.findMany.mockResolvedValue(
        [],
      );
      await service.findAll(filters);
      return getLastFindManyWhere();
    }

    it("should query with both filters when both are provided", async () => {
      const filters: PadraoNotificacaoBancariaFindDto = {
        instituicao_financeira: InstituicaoFinanceira.ITAU,
        titulo_notificacao: "Compra aprovada",
      };

      expect(await findAllWhere(filters)).toEqual({
        instituicao_financeira: InstituicaoFinanceira.ITAU,
        titulo_notificacao: "Compra aprovada",
      });
    });

    it("should query without any filter when none is provided", async () => {
      expect(await findAllWhere({})).toEqual({});
    });

    it("should query only by instituicao_financeira", async () => {
      expect(
        await findAllWhere({
          instituicao_financeira: InstituicaoFinanceira.ITAU,
        }),
      ).toEqual({
        instituicao_financeira: InstituicaoFinanceira.ITAU,
      });
    });

    it("should query only by titulo_notificacao", async () => {
      expect(
        await findAllWhere({ titulo_notificacao: "Compra aprovada" }),
      ).toEqual({
        titulo_notificacao: "Compra aprovada",
      });
    });

    it("should return expired records too", async () => {
      const expirado = buildRegistro({
        data_expiracao: new Date(Date.now() - 1000 * 60 * 60 * 24),
      });
      prismaServiceMock.padraoNotificacaoBancaria.findMany.mockResolvedValue([
        expirado,
      ]);

      const resultado = await service.findAll({});

      expect(resultado).toHaveLength(1);
      expect(resultado[0].id).toBe(expirado.id);
    });
  });
});

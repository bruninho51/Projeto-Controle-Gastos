import { Test, TestingModule } from "@nestjs/testing";
import { BadGatewayException, INestApplication } from "@nestjs/common";
import { PadroesNotificacoesBancariasModule } from "../../src/modules/api/padroes-notificacoes-bancarias/padroes-notificacoes-bancarias.module";
import { GeminiService } from "../../src/modules/gemini/gemini.service";
import { PrismaService } from "../../src/modules/prisma/prisma.service";
import { PadraoNotificacaoBancariaCreateDto } from "../../src/modules/api/padroes-notificacoes-bancarias/dtos/PadraoNotificacaoBancariaCreate.dto";
import * as request from "supertest";
import { globalPipes } from "../../src/pipes/globalPipes";
import { globalFilters } from "../../src/filters/global-filters";
import { globalInterceptors } from "../../src/interceptors/globalInterceptors";
import { runPrismaMigrations } from "../utils/run-prisma-migrations";
import { faker } from "@faker-js/faker";
import { InstituicaoFinanceira, Usuario } from "@prisma/client";
import { AuthService } from "../../src/modules/api/auth/auth.service";
import { AuthModule } from "../../src/modules/api/auth/auth.module";

jest.setTimeout(10000); // 10 segundos

const apiGlobalPrefix = "/api/v1";

function instituicaoAleatoria(): InstituicaoFinanceira {
  return faker.helpers.arrayElement(Object.values(InstituicaoFinanceira));
}

describe("PadroesNotificacoesBancariasController (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authService: AuthService;
  let user: Usuario;
  let userJwt: string;

  const geminiServiceMock = {
    gerarRegexNotificacao: jest.fn(),
  };

  beforeAll(async () => {
    await runPrismaMigrations();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [PadroesNotificacoesBancariasModule, AuthModule],
    })
      .overrideProvider(GeminiService)
      .useValue(geminiServiceMock)
      .compile();

    app = moduleFixture.createNestApplication();

    app.setGlobalPrefix(apiGlobalPrefix);

    prisma = moduleFixture.get<PrismaService>(PrismaService);
    authService = moduleFixture.get<AuthService>(AuthService);

    user = await authService.findOrCreateUser({
      aud: "test-project",
      auth_time: 1700000000,
      exp: 1700003600,
      iat: 1700000000,
      iss: "https://securetoken.google.com/test-project",
      sub: faker.string.uuid(),
      uid: faker.string.uuid(),
      firebase: {
        identities: {},
        sign_in_provider: "google.com",
      },
      email: faker.internet.email(),
      name: faker.person.fullName(),
      picture: faker.internet.url(),
    });

    userJwt = await authService.generateJwt(user);

    globalPipes.forEach((gp) => app.useGlobalPipes(gp));
    globalFilters.forEach((gf) => app.useGlobalFilters(gf));
    globalInterceptors.forEach((gi) => app.useGlobalInterceptors(gi));

    await app.init();
  });

  beforeEach(() => {
    geminiServiceMock.gerarRegexNotificacao.mockReset();
  });

  afterAll(async () => {
    await app.close();
  });

  describe(`POST ${apiGlobalPrefix}/padroes-notificacoes-bancarias`, () => {
    it("should generate a new regex with Gemini when no record exists", async () => {
      const regexGerada = "(?<valor>[\\d,.]+).*(?<estabelecimento>.+)";
      geminiServiceMock.gerarRegexNotificacao.mockResolvedValue(regexGerada);

      const createDto: PadraoNotificacaoBancariaCreateDto = {
        instituicao_financeira: instituicaoAleatoria(),
        titulo_notificacao: faker.lorem.words(3),
        corpo_notificacao: "Compra de R$ 59,90 em MERCADO SAO JOAO aprovada.",
      };

      const response = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/padroes-notificacoes-bancarias`)
        .set("Authorization", `Bearer ${userJwt}`)
        .send(createDto)
        .expect(201);

      expect(response.body).toHaveProperty("id");
      expect(response.body.regex).toBe(regexGerada);
      expect(response.body.instituicao_financeira).toBe(
        createDto.instituicao_financeira,
      );
      expect(geminiServiceMock.gerarRegexNotificacao).toHaveBeenCalledTimes(1);
    });

    it("should return the existing regex without calling Gemini when it is still valid", async () => {
      const instituicao_financeira = instituicaoAleatoria();
      const titulo_notificacao = faker.lorem.words(3);

      const registro = await prisma.padraoNotificacaoBancaria.create({
        data: {
          instituicao_financeira,
          titulo_notificacao,
          regex: "(?<valor>.+).*(?<estabelecimento>.+)",
          data_expiracao: new Date(Date.now() + 1000 * 60 * 60 * 24),
        },
      });

      const createDto: PadraoNotificacaoBancariaCreateDto = {
        instituicao_financeira,
        titulo_notificacao,
        corpo_notificacao: "Compra de R$ 59,90 em MERCADO SAO JOAO aprovada.",
      };

      const response = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/padroes-notificacoes-bancarias`)
        .set("Authorization", `Bearer ${userJwt}`)
        .send(createDto)
        .expect(201);

      expect(response.body.id).toBe(registro.id);
      expect(response.body.regex).toBe(registro.regex);
      expect(geminiServiceMock.gerarRegexNotificacao).not.toHaveBeenCalled();
    });

    it("should regenerate and update the record (without duplicating it) when it is expired", async () => {
      const instituicao_financeira = instituicaoAleatoria();
      const titulo_notificacao = faker.lorem.words(3);

      const registroExpirado = await prisma.padraoNotificacaoBancaria.create({
        data: {
          instituicao_financeira,
          titulo_notificacao,
          regex: "(?<valor>.+).*(?<estabelecimento>.+)",
          data_expiracao: new Date(Date.now() - 1000 * 60 * 60 * 24),
        },
      });

      const regexAtualizada = "(?<valor>[\\d,.]+).*(?<estabelecimento>.+)";
      geminiServiceMock.gerarRegexNotificacao.mockResolvedValue(
        regexAtualizada,
      );

      const createDto: PadraoNotificacaoBancariaCreateDto = {
        instituicao_financeira,
        titulo_notificacao,
        corpo_notificacao: "Compra de R$ 59,90 em MERCADO SAO JOAO aprovada.",
      };

      const response = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/padroes-notificacoes-bancarias`)
        .set("Authorization", `Bearer ${userJwt}`)
        .send(createDto)
        .expect(201);

      expect(response.body.id).toBe(registroExpirado.id);
      expect(response.body.regex).toBe(regexAtualizada);
      expect(geminiServiceMock.gerarRegexNotificacao).toHaveBeenCalledTimes(1);

      const registros = await prisma.padraoNotificacaoBancaria.findMany({
        where: { instituicao_financeira, titulo_notificacao },
      });
      expect(registros).toHaveLength(1);
    });

    it("should return 400 when required fields are missing", async () => {
      const response = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/padroes-notificacoes-bancarias`)
        .set("Authorization", `Bearer ${userJwt}`)
        .send({})
        .expect(400);

      expect(response.body.statusCode).toBe(400);
      expect(Array.isArray(response.body.message)).toBe(true);
    });

    it("should return 400 when instituicao_financeira is not a valid enum value", async () => {
      const createDto = {
        instituicao_financeira: "BANCO_INEXISTENTE",
        titulo_notificacao: faker.lorem.words(3),
        corpo_notificacao: "Compra de R$ 59,90 em MERCADO SAO JOAO aprovada.",
      };

      const response = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/padroes-notificacoes-bancarias`)
        .set("Authorization", `Bearer ${userJwt}`)
        .send(createDto)
        .expect(400);

      expect(response.body.statusCode).toBe(400);
      expect(response.body.message).toEqual([
        "instituicao_financeira must be one of the following values: INTER, ITAU, NUBANK, ALELO, IFOOD_BENEFICIOS",
      ]);
      expect(geminiServiceMock.gerarRegexNotificacao).not.toHaveBeenCalled();
    });

    it("should return 502 when Gemini fails to generate a valid regex", async () => {
      geminiServiceMock.gerarRegexNotificacao.mockRejectedValue(
        new BadGatewayException(
          "O serviço de geração de regex retornou um erro.",
        ),
      );

      const createDto: PadraoNotificacaoBancariaCreateDto = {
        instituicao_financeira: instituicaoAleatoria(),
        titulo_notificacao: faker.lorem.words(3),
        corpo_notificacao: "Compra de R$ 59,90 em MERCADO SAO JOAO aprovada.",
      };

      const response = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/padroes-notificacoes-bancarias`)
        .set("Authorization", `Bearer ${userJwt}`)
        .send(createDto)
        .expect(502);

      expect(response.body.statusCode).toBe(502);
    });
  });

  describe(`GET ${apiGlobalPrefix}/padroes-notificacoes-bancarias`, () => {
    it("should return all records when no filter is provided, including expired ones", async () => {
      const instituicao_financeira = instituicaoAleatoria();
      const titulo_notificacao = faker.lorem.words(2);

      const registro = await prisma.padraoNotificacaoBancaria.create({
        data: {
          instituicao_financeira,
          titulo_notificacao,
          regex: "(?<valor>.+).*(?<estabelecimento>.+)",
          data_expiracao: new Date(Date.now() - 1000 * 60 * 60 * 24),
        },
      });

      const response = await request(app.getHttpServer())
        .get(`${apiGlobalPrefix}/padroes-notificacoes-bancarias`)
        .set("Authorization", `Bearer ${userJwt}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      const encontrado = response.body.find((r) => r.id === registro.id);
      expect(encontrado).toBeDefined();
    });

    it("should filter only by instituicao_financeira", async () => {
      const instituicao_financeira = instituicaoAleatoria();

      const registro = await prisma.padraoNotificacaoBancaria.create({
        data: {
          instituicao_financeira,
          titulo_notificacao: faker.lorem.words(2),
          regex: "(?<valor>.+).*(?<estabelecimento>.+)",
          data_expiracao: new Date(Date.now() + 1000 * 60 * 60 * 24),
        },
      });

      const response = await request(app.getHttpServer())
        .get(`${apiGlobalPrefix}/padroes-notificacoes-bancarias`)
        .query({ instituicao_financeira })
        .set("Authorization", `Bearer ${userJwt}`)
        .expect(200);

      const encontrado = response.body.find((r) => r.id === registro.id);
      expect(encontrado).toBeDefined();
      expect(
        response.body.every(
          (r) => r.instituicao_financeira === instituicao_financeira,
        ),
      ).toBe(true);
    });

    it("should filter only by titulo_notificacao", async () => {
      const titulo_notificacao = faker.lorem.words(3);

      const registro = await prisma.padraoNotificacaoBancaria.create({
        data: {
          instituicao_financeira: instituicaoAleatoria(),
          titulo_notificacao,
          regex: "(?<valor>.+).*(?<estabelecimento>.+)",
          data_expiracao: new Date(Date.now() + 1000 * 60 * 60 * 24),
        },
      });

      const response = await request(app.getHttpServer())
        .get(`${apiGlobalPrefix}/padroes-notificacoes-bancarias`)
        .query({ titulo_notificacao })
        .set("Authorization", `Bearer ${userJwt}`)
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].id).toBe(registro.id);
    });

    it("should filter by both instituicao_financeira and titulo_notificacao together", async () => {
      const instituicao_financeira = instituicaoAleatoria();
      const titulo_notificacao = faker.lorem.words(3);

      const registro = await prisma.padraoNotificacaoBancaria.create({
        data: {
          instituicao_financeira,
          titulo_notificacao,
          regex: "(?<valor>.+).*(?<estabelecimento>.+)",
          data_expiracao: new Date(Date.now() + 1000 * 60 * 60 * 24),
        },
      });

      await prisma.padraoNotificacaoBancaria.create({
        data: {
          instituicao_financeira,
          titulo_notificacao: faker.lorem.words(4),
          regex: "(?<valor>.+).*(?<estabelecimento>.+)",
          data_expiracao: new Date(Date.now() + 1000 * 60 * 60 * 24),
        },
      });

      const response = await request(app.getHttpServer())
        .get(`${apiGlobalPrefix}/padroes-notificacoes-bancarias`)
        .query({ instituicao_financeira, titulo_notificacao })
        .set("Authorization", `Bearer ${userJwt}`)
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].id).toBe(registro.id);
    });

    it("should return 400 when instituicao_financeira filter is not a valid enum value", async () => {
      const response = await request(app.getHttpServer())
        .get(`${apiGlobalPrefix}/padroes-notificacoes-bancarias`)
        .query({ instituicao_financeira: "BANCO_INEXISTENTE" })
        .set("Authorization", `Bearer ${userJwt}`)
        .expect(400);

      expect(response.body.statusCode).toBe(400);
      expect(response.body.message).toEqual([
        "instituicao_financeira must be one of the following values: INTER, ITAU, NUBANK, ALELO, IFOOD_BENEFICIOS",
      ]);
    });
  });
});

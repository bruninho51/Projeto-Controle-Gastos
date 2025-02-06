import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { PrismaService } from "../../src/modules/prisma/prisma.service";
import { OrcamentosModule } from "../../src/modules/api/orcamentos/orcamentos.module";
import { OrcamentoCreateDto } from "../../src/modules/api/orcamentos/dtos/OrcamentoCreate.dto";
import { globalPipes } from "../../src/pipes/globalPipes";
import { globalFilters } from "../../src/filters/global-filters";
import { globalInterceptors } from "../../src/interceptors/globalInterceptors";
import { runPrismaMigrations } from "../utils/run-prisma-migrations";
import { faker } from "@faker-js/faker";
import { OrcamentoUpdateDto } from "../../src/modules/api/orcamentos/dtos/OrcamentoUpdate.dto";
import { GastoFixoCreateDto } from "../../src/modules/api/gastos-fixos/dtos/GastoFixoCreate.dto";
import { CategoriasGastosModule } from "../../src/modules/api/categorias-gastos/categorias-gastos.module";
import { GastosFixosModule } from "../../src/modules/api/gastos-fixos/gastos-fixos.module";
import { GastosVariadosModule } from "../../src/modules/api/gastos-variados/gastos-variados.module";
import { GastoVariadoCreateDto } from "../../src/modules/api/gastos-variados/dtos/GastoVariadoCreate.dto";
import { GastoFixoUpdateDto } from "../../src/modules/api/gastos-fixos/dtos/GastoFixoUpdate.dto";
import { formatValue } from "../utils/format-value";
import { AuthService } from "../../src/modules/api/auth/auth.service";
import { AuthModule } from "../../src/modules/api/auth/auth.module";
import { CategoriaGasto, Usuario } from "@prisma/client";

jest.setTimeout(10000); // 10 segundos

const apiGlobalPrefix = "/api/v1";

describe("OrcamentosController (v1) (E2E)", () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let authService: AuthService;
  let user: Usuario;
  let categoriaGasto: CategoriaGasto;
  let userJwt: string;

  beforeAll(async () => {
    await runPrismaMigrations();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        OrcamentosModule,
        CategoriasGastosModule,
        GastosFixosModule,
        GastosVariadosModule,
        AuthModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.setGlobalPrefix(apiGlobalPrefix);

    prismaService = moduleFixture.get<PrismaService>(PrismaService);
    authService = moduleFixture.get<AuthService>(AuthService);

    user = await authService.findOrCreateUser({
      email: faker.internet.email(),
      name: faker.person.fullName(),
      picture: faker.internet.url(),
      uid: faker.string.uuid(),
    });

    userJwt = await authService.generateJwt(user);

    categoriaGasto = await prismaService.categoriaGasto.create({
      data: {
        nome: faker.string.alpha(5),
        usuario_id: user.id,
      }
    });

    globalPipes.forEach((gp) => app.useGlobalPipes(gp));
    globalFilters.forEach((gf) => app.useGlobalFilters(gf));
    globalInterceptors.forEach((gi) => app.useGlobalInterceptors(gi));

    await app.init();
  });

  afterAll(async () => {
    await prismaService.$disconnect();
    await app.close();
  });

  describe(`POST ${apiGlobalPrefix}/orcamentos`, () => {
    it("should create a new orcamento", async () => {
      const createOrcamentoDto = {
        nome: "Orçamento A",
        valor_inicial: "1000.45",
      };

      const response = await request(app.getHttpServer())
      .post(`${apiGlobalPrefix}/orcamentos`)
      .set('Authorization', `Bearer ${userJwt}`)
        .send(createOrcamentoDto)
        .expect(201);

      expect(response.body).toHaveProperty("id");
      expect(response.body.nome).toBe(createOrcamentoDto.nome);
      expect(response.body.valor_inicial).toBe(
        createOrcamentoDto.valor_inicial,
      );
      expect(response.body.valor_atual).toBe(createOrcamentoDto.valor_inicial);
      expect(response.body.valor_livre).toBe(createOrcamentoDto.valor_inicial);
    });

    it("should return 400 with correct messages when create a new orcamento when all fields as null", async () => {
      const createOrcamentoDto: Required<OrcamentoCreateDto> = {
        nome: null,
        valor_inicial: null,
      };

      const response = await request(app.getHttpServer())
      .post(`${apiGlobalPrefix}/orcamentos`)
      .set('Authorization', `Bearer ${userJwt}`)
        .send(createOrcamentoDto)
        .expect(400);

      expect(response.body).toHaveProperty("message");
      expect(Array.isArray(response.body.message)).toBe(true);

      expect(response.body.message).toEqual([
        "nome should not be empty",
        "nome must be a string",
        "valor_inicial should not be empty",
        "valor_inicial is not a valid decimal number.",
      ]);
    });

    it("should return 400 with correct messages when create a new orcamento when all fields wrong", async () => {
      const createOrcamentoDto: Required<OrcamentoCreateDto> = {
        nome: faker.number.int({ min: 100, max: 999 }) as unknown as string,
        valor_inicial: faker.string.alpha(5),
      };

      const response = await request(app.getHttpServer())
      .post(`${apiGlobalPrefix}/orcamentos`)
      .set('Authorization', `Bearer ${userJwt}`)
        .send(createOrcamentoDto)
        .expect(400);

      expect(response.body).toHaveProperty("message");
      expect(Array.isArray(response.body.message)).toBe(true);

      expect(response.body.message).toEqual([
        "nome must be a string",
        "valor_inicial is not a valid decimal number.",
      ]);
    });

    it("should create orcamento even if it has already been created and deleted (soft delete)", async () => {
      const nome = faker.string.alphanumeric(6).toUpperCase();
      const valor_inicial = faker.number
        .float({ min: 1000, max: 5000, fractionDigits: 2 })
        .toString();

      const orcamento = await prismaService.orcamento.create({
        data: {
          nome,
          valor_inicial,
          soft_delete: new Date(),
          usuario_id: user.id,
        },
      });

      const response = await request(app.getHttpServer())
      .post(`${apiGlobalPrefix}/orcamentos`)
      .set('Authorization', `Bearer ${userJwt}`)
        .send({ nome, valor_inicial })
        .expect(201);

      expect(response.body).toHaveProperty("id");
      expect(response.body.id).not.toBe(orcamento.id);
      expect(response.body.nome).toBe(nome);
      expect(response.body.valor_inicial).toBe(valor_inicial);
      expect(response.body.valor_atual).toBe(valor_inicial);
      expect(response.body.valor_livre).toBe(valor_inicial);
    });

    it("should return 400 on pass an invalid field on create a new orcamento", async () => {
      const createOrcamentoDto = {
        nome: "Orçamento A",
        valor_inicial: "1000.45",
        valor_atual: "1030.32", // campo inválido (calculado pela aplicação)
      } as OrcamentoCreateDto;

      await request(app.getHttpServer())
      .post(`${apiGlobalPrefix}/orcamentos`)
      .set('Authorization', `Bearer ${userJwt}`)
        .send(createOrcamentoDto)
        .expect(400);
    });
  });

  describe("GET ${apiGlobalPrefix}/orcamentos", () => {
    it("should return all orcamentos", async () => {
      const response = await request(app.getHttpServer())
      .get(`${apiGlobalPrefix}/orcamentos`)
      .set('Authorization', `Bearer ${userJwt}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it("should not return soft deleted orcamentos", async () => {
      const orcamento = await prismaService.orcamento.create({
        data: {
          nome: "Teste",
          valor_inicial: "3000",
          soft_delete: new Date(),
          usuario_id: user.id,
        },
      });

      const response = await request(app.getHttpServer())
      .get(
        `${apiGlobalPrefix}/orcamentos`,
      )
      .set('Authorization', `Bearer ${userJwt}`)

      const result = response.body.filter((o) => o.id === orcamento.id);

      expect(result.length).toBe(0);
    });
  });

  describe(`GET ${apiGlobalPrefix}/orcamentos/:id`, () => {
    it("should return a single orcamento", async () => {
      const createOrcamentoDto = {
        nome: "Orçamento B",
        valor_inicial: "500.20",
      };

      const createResponse = await request(app.getHttpServer())
      .post(`${apiGlobalPrefix}/orcamentos`)
      .set('Authorization', `Bearer ${userJwt}`)
        .send(createOrcamentoDto)
        .expect(201);

      const orcamentoId = createResponse.body.id;

      const response = await request(app.getHttpServer())
      .get(`${apiGlobalPrefix}/orcamentos/${orcamentoId}`)
      .set('Authorization', `Bearer ${userJwt}`)
        .expect(200);

      expect(response.body.id).toBe(orcamentoId);
      expect(response.body.nome).toBe(createOrcamentoDto.nome);
    });

    it("should return 404 if orcamento not found", async () => {
      const response = await request(app.getHttpServer())
      .get(`${apiGlobalPrefix}/orcamentos/9999`)
      .set('Authorization', `Bearer ${userJwt}`)
        .expect(404);

      expect(response.body.message).toBe("Not Found");
    });

    it("should return 404 if orcamento was soft deleted", async () => {
      const createOrcamentoDto = {
        nome: faker.string.alphanumeric(5),
        valor_inicial: formatValue(
          faker.number.float({ min: 1999, max: 9999, fractionDigits: 2 }),
        ),
      };

      const createResponse = await request(app.getHttpServer())
      .post(`${apiGlobalPrefix}/orcamentos`)
      .set('Authorization', `Bearer ${userJwt}`)
        .send(createOrcamentoDto)
        .expect(201);

      const orcamentoId = createResponse.body.id;

      await request(app.getHttpServer())
      .delete(`${apiGlobalPrefix}/orcamentos/${orcamentoId}`)
      .set('Authorization', `Bearer ${userJwt}`)
        .expect(200);

      const response = await request(app.getHttpServer())
      .get(`${apiGlobalPrefix}/orcamentos/${orcamentoId}`)
      .set('Authorization', `Bearer ${userJwt}`)
        .expect(404);

      expect(response.body.message).toBe("Not Found");
    });
  });

  describe(`PATCH ${apiGlobalPrefix}/orcamentos/:id`, () => {
    it("should update an orcamento", async () => {
      const createOrcamentoDto = {
        nome: "Orçamento C",
        valor_inicial: "700.10",
      };

      const createResponse = await request(app.getHttpServer())
      .post(`${apiGlobalPrefix}/orcamentos`)
      .set('Authorization', `Bearer ${userJwt}`)
        .send(createOrcamentoDto)
        .expect(201);

      const orcamentoId = createResponse.body.id;

      const updateOrcamentoDto = {
        nome: "Orçamento C Atualizado",
        valor_inicial: "850.00",
      };

      const response = await request(app.getHttpServer())
      .patch(`${apiGlobalPrefix}/orcamentos/${orcamentoId}`)
      .set('Authorization', `Bearer ${userJwt}`)
        .send(updateOrcamentoDto)
        .expect(200);

      expect(response.body.nome).toBe(updateOrcamentoDto.nome);
      expect(response.body.valor_inicial).toBe("850");

      expect(response.body.valor_atual).toBe("850");
      expect(response.body.valor_livre).toBe("850");
    });

    it("should return 200 when inactivate an orcamento", async () => {
      const createOrcamentoDto = {
        nome: "Orçamento C",
        valor_inicial: "700.10",
      };

      const createResponse = await request(app.getHttpServer())
      .post(`${apiGlobalPrefix}/orcamentos`)
      .set('Authorization', `Bearer ${userJwt}`)
      .send(createOrcamentoDto)
        .expect(201);

      const orcamentoId = createResponse.body.id;

      const updateOrcamentoDto: OrcamentoUpdateDto = {
        data_inatividade: new Date(),
      };

      const response = await request(app.getHttpServer())
      .patch(`${apiGlobalPrefix}/orcamentos/${orcamentoId}`)
      .set('Authorization', `Bearer ${userJwt}`)
        .send(updateOrcamentoDto)
        .expect(200);

      expect(response.body.data_inatividade).toBeTruthy();
    });

    it("should return 200 when activate an orcamento", async () => {
      const createOrcamentoDto: OrcamentoCreateDto = {
        nome: "Orçamento C",
        valor_inicial: "700.10",
      };

      const createResponse = await request(app.getHttpServer())
      .post(`${apiGlobalPrefix}/orcamentos`)
      .set('Authorization', `Bearer ${userJwt}`)
        .send(createOrcamentoDto)
        .expect(201);

      const orcamentoId = createResponse.body.id;

      const updateOrcamentoDto: OrcamentoUpdateDto = {
        data_inatividade: null,
      };

      const response = await request(app.getHttpServer())
      .patch(`${apiGlobalPrefix}/orcamentos/${orcamentoId}`)
      .set('Authorization', `Bearer ${userJwt}`)
        .send(updateOrcamentoDto)
        .expect(200);

      expect(response.body.data_inatividade).toBeNull();
    });

    it("should return 400 with correct messages when update an orcamento when all fields as null", async () => {
      const createOrcamentoDto = {
        nome: "Orçamento C",
        valor_inicial: "700.10",
      };

      const createResponse = await request(app.getHttpServer())
      .post(`${apiGlobalPrefix}/orcamentos`)
      .set('Authorization', `Bearer ${userJwt}`)
        .send(createOrcamentoDto)
        .expect(201);

      const orcamentoId = createResponse.body.id;

      const updateOrcamentoDto: Required<OrcamentoUpdateDto> = {
        nome: null,
        valor_inicial: null,
        data_encerramento: null,
        data_inatividade: null,
      };

      const response = await request(app.getHttpServer())
      .patch(`${apiGlobalPrefix}/orcamentos/${orcamentoId}`)
      .set('Authorization', `Bearer ${userJwt}`)
        .send(updateOrcamentoDto)
        .expect(400);

      expect(response.body).toHaveProperty("message");
      expect(Array.isArray(response.body.message)).toBe(true);

      expect(response.body.message).toEqual([
        "nome should not be empty",
        "nome must be a string",
        "valor_inicial should not be empty",
        "valor_inicial is not a valid decimal number.",
      ]);
    });

    it("should return 400 with correct messages when update an orcamento when all fields as wrong", async () => {
      const createOrcamentoDto = {
        nome: "Orçamento C",
        valor_inicial: "700.10",
      };

      const createResponse = await request(app.getHttpServer())
      .post(`${apiGlobalPrefix}/orcamentos`)
      .set('Authorization', `Bearer ${userJwt}`)
        .send(createOrcamentoDto)
        .expect(201);

      const orcamentoId = createResponse.body.id;

      const updateOrcamentoDto: Required<OrcamentoUpdateDto> = {
        nome: faker.number.int({ min: 100, max: 999 }) as unknown as string,
        valor_inicial: faker.string.alpha(5),
        data_encerramento: faker.string.alpha(5) as unknown as Date,
        data_inatividade: faker.string.alpha(5) as unknown as Date,
      };

      const response = await request(app.getHttpServer())
      .patch(`${apiGlobalPrefix}/orcamentos/${orcamentoId}`)
      .set('Authorization', `Bearer ${userJwt}`)
        .send(updateOrcamentoDto)
        .expect(400);

      expect(response.body).toHaveProperty("message");
      expect(Array.isArray(response.body.message)).toBe(true);

      expect(response.body.message).toEqual([
        "nome must be a string",
        "valor_inicial is not a valid decimal number.",
        "data_encerramento must be a Date instance",
        "data_inatividade must be a Date instance",
      ]);
    });

    it("should return 404 if try to update an orcamento was deleted (soft delete)", async () => {
      const createOrcamentoDto = {
        nome: "Orçamento C",
        valor_inicial: "700.10",
      };

      const createResponse = await request(app.getHttpServer())
      .post(`${apiGlobalPrefix}/orcamentos`)
      .set('Authorization', `Bearer ${userJwt}`)
        .send(createOrcamentoDto)
        .expect(201);

      const orcamentoId = createResponse.body.id;

      await request(app.getHttpServer())
      .delete(
        `${apiGlobalPrefix}/orcamentos/${orcamentoId}`,
      )
      .set('Authorization', `Bearer ${userJwt}`);

      const updateOrcamentoDto = {
        nome: "Orçamento C Atualizado",
        valor_inicial: "850.00",
      };

      await request(app.getHttpServer())
      .patch(`${apiGlobalPrefix}/orcamentos/${orcamentoId}`)
      .set('Authorization', `Bearer ${userJwt}`)
        .send(updateOrcamentoDto)
        .expect(404);
    });
  });

  describe(`DELETE ${apiGlobalPrefix}/orcamentos/:id`, () => {
    it("should delete an orcamento (soft delete)", async () => {
      const createOrcamentoDto = {
        nome: "Orçamento D",
        valor_inicial: "900.00",
      };

      const createResponse = await request(app.getHttpServer())
      .post(`${apiGlobalPrefix}/orcamentos`)
      .set('Authorization', `Bearer ${userJwt}`)
        .send(createOrcamentoDto)
        .expect(201);

      const orcamentoId = createResponse.body.id;

      const response = await request(app.getHttpServer())
      .delete(`${apiGlobalPrefix}/orcamentos/${orcamentoId}`)
      .set('Authorization', `Bearer ${userJwt}`)
        .expect(200);

      expect(response.body.soft_delete).toBeTruthy();
    });

    it("should return 404 if orcamento was deleted (soft delete)", async () => {
      const createOrcamentoDto = {
        nome: "Orçamento D",
        valor_inicial: "900.00",
      };

      const createResponse = await request(app.getHttpServer())
      .post(`${apiGlobalPrefix}/orcamentos`)
      .set('Authorization', `Bearer ${userJwt}`)
        .send(createOrcamentoDto)
        .expect(201);

      const orcamentoId = createResponse.body.id;

      await request(app.getHttpServer())
      .delete(
        `${apiGlobalPrefix}/orcamentos/${orcamentoId}`,
      )
      .set('Authorization', `Bearer ${userJwt}`);

      await request(app.getHttpServer())
      .delete(`${apiGlobalPrefix}/orcamentos/${orcamentoId}`)
      .set('Authorization', `Bearer ${userJwt}`)
        .expect(404);
    });
  });

  describe("Budget value calculations", () => {
    it("should correctly update valor_inicial, valor_atual, and valor_livre when creating a new gasto fixo", async () => {
      const orcamentoMock: OrcamentoCreateDto = {
        nome: faker.string.alphanumeric(5),
        valor_inicial: formatValue(
          faker.number.float({ min: 100, max: 9999, fractionDigits: 2 }),
        ),
      };

      const orcamento = await request(app.getHttpServer())
      .post(`${apiGlobalPrefix}/orcamentos`)
      .set('Authorization', `Bearer ${userJwt}`)
        .send(orcamentoMock)
        .expect(201);

      const gastoFixoMock: GastoFixoCreateDto = {
        categoria_id: categoriaGasto.id,
        descricao: faker.string.alphanumeric(5),
        previsto: formatValue(
          faker.number.float({
            min: 50,
            max: Number(orcamentoMock.valor_inicial),
            fractionDigits: 2,
          }),
        ),
        observacoes: faker.string.alphanumeric(5),
      };

      await request(app.getHttpServer())
      .post(`${apiGlobalPrefix}/orcamentos/${orcamento.body.id}/gastos-fixos`)
      .set('Authorization', `Bearer ${userJwt}`)
        .send(gastoFixoMock)
        .expect(201);

      const response = await request(app.getHttpServer())
      .get(`${apiGlobalPrefix}/orcamentos/${orcamento.body.id}`)
      .set('Authorization', `Bearer ${userJwt}`)
        .expect(200);

      const valor_inicial = orcamentoMock.valor_inicial;
      const valor_atual = valor_inicial;
      const valor_livre = formatValue(
        Number(valor_inicial) - Number(gastoFixoMock.previsto),
      );

      expect(response.body).toEqual({
        id: orcamento.body.id,
        nome: orcamentoMock.nome,
        usuario_id: user.id,
        valor_inicial: valor_inicial,
        valor_atual: valor_atual,
        valor_livre: valor_livre,
        data_encerramento: null,
        data_criacao: expect.stringMatching(
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
        ),
        data_atualizacao: expect.stringMatching(
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
        ),
        data_inatividade: null,
        soft_delete: null,
      });
    });

    it("should correctly update valor_inicial, valor_atual, and valor_livre when paying a gasto fixo", async () => {
      const orcamentoMock: OrcamentoCreateDto = {
        nome: faker.string.alphanumeric(5),
        valor_inicial: formatValue(
          faker.number.float({ min: 100, max: 9999, fractionDigits: 2 }),
        ),
      };

      const orcamento = await request(app.getHttpServer())
      .post(`${apiGlobalPrefix}/orcamentos`)
      .set('Authorization', `Bearer ${userJwt}`)
        .send(orcamentoMock)
        .expect(201);

      const gastoFixoMock: GastoFixoCreateDto = {
        categoria_id: categoriaGasto.id,
        descricao: faker.string.alphanumeric(5),
        previsto: formatValue(
          faker.number.float({
            min: 50,
            max: Number(orcamentoMock.valor_inicial),
            fractionDigits: 2,
          }),
        ),
        observacoes: faker.string.alphanumeric(5),
      };

      const gastoFixo = await request(app.getHttpServer())
      .post(`${apiGlobalPrefix}/orcamentos/${orcamento.body.id}/gastos-fixos`)
      .set('Authorization', `Bearer ${userJwt}`)
        .send(gastoFixoMock)
        .expect(201);

      const gastoFixoUpdateMock: GastoFixoUpdateDto = {
        valor: formatValue(
          faker.number.float({
            min: 25,
            max: Number(gastoFixoMock.previsto),
            fractionDigits: 2,
          }),
        ),
        data_pgto: new Date(),
      };

      const res = await request(app.getHttpServer())
      .patch(
        `${apiGlobalPrefix}/orcamentos/${orcamento.body.id}/gastos-fixos/${gastoFixo.body.id}`,
      )
      .set('Authorization', `Bearer ${userJwt}`)
        .send(gastoFixoUpdateMock)
        .expect(200);

      expect(res.status).toBe(200);

      const response = await request(app.getHttpServer())
      .get(`${apiGlobalPrefix}/orcamentos/${orcamento.body.id}`)
      .set('Authorization', `Bearer ${userJwt}`)
        .expect(200);

      const valor_inicial = orcamentoMock.valor_inicial;
      const valor_atual = formatValue(
        Number(valor_inicial) - Number(gastoFixoUpdateMock.valor),
      );
      const valor_livre = formatValue(
        Number(valor_inicial) - Number(gastoFixoUpdateMock.valor),
      );

      expect(response.body).toEqual({
        id: orcamento.body.id,
        nome: orcamentoMock.nome,
        usuario_id: user.id,
        valor_inicial: valor_inicial,
        valor_atual: valor_atual,
        valor_livre: valor_livre,
        data_encerramento: null,
        data_criacao: expect.stringMatching(
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
        ),
        data_atualizacao: expect.stringMatching(
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
        ),
        data_inatividade: null,
        soft_delete: null,
      });
    });

    it("should correctly update valor_inicial, valor_atual, and valor_livre when creating a new gasto variado", async () => {
      const orcamentoMock: OrcamentoCreateDto = {
        nome: faker.string.alphanumeric(5),
        valor_inicial: formatValue(
          faker.number.float({ min: 100, max: 9999, fractionDigits: 2 }),
        ),
      };

      const orcamento = await request(app.getHttpServer())
      .post(`${apiGlobalPrefix}/orcamentos`)
      .set('Authorization', `Bearer ${userJwt}`)
        .send(orcamentoMock)
        .expect(201);

      const gastoVariadoMock: GastoVariadoCreateDto = {
        categoria_id: categoriaGasto.id,
        descricao: faker.string.alphanumeric(5),
        valor: formatValue(
          faker.number.float({
            min: 50,
            max: Number(orcamentoMock.valor_inicial),
            fractionDigits: 2,
          }),
        ),
        data_pgto: new Date(),
        observacoes: faker.string.alphanumeric(5),
      };

      await request(app.getHttpServer())
      .post(
        `${apiGlobalPrefix}/orcamentos/${orcamento.body.id}/gastos-variados`,
      )
      .set('Authorization', `Bearer ${userJwt}`)
        .send(gastoVariadoMock)
        .expect(201);

      const response = await request(app.getHttpServer())
      .get(`${apiGlobalPrefix}/orcamentos/${orcamento.body.id}`)
      .set('Authorization', `Bearer ${userJwt}`)
        .expect(200);

      const valor_inicial = orcamentoMock.valor_inicial;
      const valor_atual = formatValue(
        Number(valor_inicial) - Number(gastoVariadoMock.valor),
      );
      const valor_livre = formatValue(
        Number(valor_inicial) - Number(gastoVariadoMock.valor),
      );

      expect(response.body).toEqual({
        id: orcamento.body.id,
        nome: orcamentoMock.nome,
        usuario_id: user.id,
        valor_inicial: valor_inicial,
        valor_atual: valor_atual,
        valor_livre: valor_livre,
        data_encerramento: null,
        data_criacao: expect.stringMatching(
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
        ),
        data_atualizacao: expect.stringMatching(
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
        ),
        data_inatividade: null,
        soft_delete: null,
      });
    });

    it("should correctly update valor_inicial, valor_atual, and valor_livre when deleting an unpaid gasto fixo", async () => {
      const orcamentoMock: OrcamentoCreateDto = {
        nome: faker.string.alphanumeric(5),
        valor_inicial: formatValue(
          faker.number.float({ min: 100, max: 9999, fractionDigits: 2 }),
        ),
      };

      const orcamento = await request(app.getHttpServer())
      .post(`${apiGlobalPrefix}/orcamentos`)
      .set('Authorization', `Bearer ${userJwt}`)
        .send(orcamentoMock)
        .expect(201);

      const gastoFixoMock: GastoFixoCreateDto = {
        categoria_id: categoriaGasto.id,
        descricao: faker.string.alphanumeric(5),
        previsto: formatValue(
          faker.number.float({
            min: 50,
            max: Number(orcamentoMock.valor_inicial),
            fractionDigits: 2,
          }),
        ),
        observacoes: faker.string.alphanumeric(5),
      };

      const gastoFixo = await request(app.getHttpServer())
      .post(`${apiGlobalPrefix}/orcamentos/${orcamento.body.id}/gastos-fixos`)
      .set('Authorization', `Bearer ${userJwt}`)
        .send(gastoFixoMock)
        .expect(201);

      await request(app.getHttpServer())
      .delete(
        `${apiGlobalPrefix}/orcamentos/${orcamento.body.id}/gastos-fixos/${gastoFixo.body.id}`,
      )
      .set('Authorization', `Bearer ${userJwt}`)
        .expect(200);

      const response = await request(app.getHttpServer())
      .get(`${apiGlobalPrefix}/orcamentos/${orcamento.body.id}`)
      .set('Authorization', `Bearer ${userJwt}`)
        .expect(200);

      const valor_inicial = orcamentoMock.valor_inicial;
      const valor_atual = valor_inicial;
      const valor_livre = valor_inicial;

      expect(response.body).toEqual({
        id: orcamento.body.id,
        nome: orcamentoMock.nome,
        usuario_id: user.id,
        valor_inicial: valor_inicial,
        valor_atual: valor_atual,
        valor_livre: valor_livre,
        data_encerramento: null,
        data_criacao: expect.stringMatching(
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
        ),
        data_atualizacao: expect.stringMatching(
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
        ),
        data_inatividade: null,
        soft_delete: null,
      });
    });

    it("should correctly update valor_inicial, valor_atual, and valor_livre when deleting a paid gasto fixo", async () => {
      const orcamentoMock: OrcamentoCreateDto = {
        nome: faker.string.alphanumeric(5),
        valor_inicial: formatValue(
          faker.number.float({ min: 100, max: 9999, fractionDigits: 2 }),
        ),
      };

      const orcamento = await request(app.getHttpServer())
      .post(`${apiGlobalPrefix}/orcamentos`)
      .set('Authorization', `Bearer ${userJwt}`)
        .send(orcamentoMock)
        .expect(201);

      const gastoFixoMock: GastoFixoCreateDto = {
        categoria_id: categoriaGasto.id,
        descricao: faker.string.alphanumeric(5),
        previsto: formatValue(
          faker.number.float({
            min: 50,
            max: Number(orcamentoMock.valor_inicial),
            fractionDigits: 2,
          }),
        ),
        observacoes: faker.string.alphanumeric(5),
      };

      const gastoFixo = await request(app.getHttpServer())
      .post(`${apiGlobalPrefix}/orcamentos/${orcamento.body.id}/gastos-fixos`)
      .set('Authorization', `Bearer ${userJwt}`)
        .send(gastoFixoMock)
        .expect(201);

      const gastoFixoUpdateMock: GastoFixoUpdateDto = {
        valor: formatValue(
          faker.number.float({
            min: 25,
            max: Number(gastoFixoMock.previsto),
            fractionDigits: 2,
          }),
        ),
        data_pgto: new Date(),
      };

      await request(app.getHttpServer())
      .patch(
        `${apiGlobalPrefix}/orcamentos/${orcamento.body.id}/gastos-fixos/${gastoFixo.body.id}`,
      )
      .set('Authorization', `Bearer ${userJwt}`)
        .send(gastoFixoUpdateMock)
        .expect(200);

      await request(app.getHttpServer())
      .delete(
        `${apiGlobalPrefix}/orcamentos/${orcamento.body.id}/gastos-fixos/${gastoFixo.body.id}`,
      )
      .set('Authorization', `Bearer ${userJwt}`)
        .expect(200);

      const response = await request(app.getHttpServer())
      .get(`${apiGlobalPrefix}/orcamentos/${orcamento.body.id}`)
      .set('Authorization', `Bearer ${userJwt}`)
        .expect(200);

      const valor_inicial = orcamentoMock.valor_inicial;
      const valor_atual = valor_inicial;
      const valor_livre = valor_inicial;

      expect(response.body).toEqual({
        id: orcamento.body.id,
        nome: orcamentoMock.nome,
        usuario_id: user.id,
        valor_inicial: valor_inicial,
        valor_atual: valor_atual,
        valor_livre: valor_livre,
        data_encerramento: null,
        data_criacao: expect.stringMatching(
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
        ),
        data_atualizacao: expect.stringMatching(
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
        ),
        data_inatividade: null,
        soft_delete: null,
      });
    });

    it("should correctly update valor_inicial, valor_atual, and valor_livre when deleting a gasto variado", async () => {
      const orcamentoMock: OrcamentoCreateDto = {
        nome: faker.string.alphanumeric(5),
        valor_inicial: formatValue(
          faker.number.float({ min: 100, max: 9999, fractionDigits: 2 }),
        ),
      };

      const orcamento = await request(app.getHttpServer())
      .post(`${apiGlobalPrefix}/orcamentos`)
      .set('Authorization', `Bearer ${userJwt}`)
        .send(orcamentoMock)
        .expect(201);

      const gastoVariadoMock: GastoVariadoCreateDto = {
        categoria_id: categoriaGasto.id,
        descricao: faker.string.alphanumeric(5),
        valor: formatValue(
          faker.number.float({
            min: 50,
            max: Number(orcamentoMock.valor_inicial),
            fractionDigits: 2,
          }),
        ),
        data_pgto: new Date(),
        observacoes: faker.string.alphanumeric(5),
      };

      const gastoVariado = await request(app.getHttpServer())
      .post(
        `${apiGlobalPrefix}/orcamentos/${orcamento.body.id}/gastos-variados`,
      )
      .set('Authorization', `Bearer ${userJwt}`)
        .send(gastoVariadoMock)
        .expect(201);

      await request(app.getHttpServer())
      .delete(
        `${apiGlobalPrefix}/orcamentos/${orcamento.body.id}/gastos-variados/${gastoVariado.body.id}`,
      )
      .set('Authorization', `Bearer ${userJwt}`)
        .expect(200);

      const response = await request(app.getHttpServer())
      .get(`${apiGlobalPrefix}/orcamentos/${orcamento.body.id}`)
      .set('Authorization', `Bearer ${userJwt}`)
        .expect(200);

      const valor_inicial = orcamentoMock.valor_inicial;
      const valor_atual = valor_inicial;
      const valor_livre = valor_inicial;

      expect(response.body).toEqual({
        id: orcamento.body.id,
        nome: orcamentoMock.nome,
        usuario_id: user.id,
        valor_inicial: valor_inicial,
        valor_atual: valor_atual,
        valor_livre: valor_livre,
        data_encerramento: null,
        data_criacao: expect.stringMatching(
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
        ),
        data_atualizacao: expect.stringMatching(
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
        ),
        data_inatividade: null,
        soft_delete: null,
      });
    });

    it("should correctly update valor_inicial, valor_atual, and valor_livre when add and delete an unpaid gasto fixo and update valor_inicial", async () => {
      const orcamentoMock: OrcamentoCreateDto = {
        nome: faker.string.alphanumeric(5),
        valor_inicial: formatValue(
          faker.number.float({ min: 100, max: 9999, fractionDigits: 2 }),
        ),
      };

      const orcamento = await request(app.getHttpServer())
      .post(`${apiGlobalPrefix}/orcamentos`)
      .set('Authorization', `Bearer ${userJwt}`)
        .send(orcamentoMock)
        .expect(201);

      const gastoFixoMock: GastoFixoCreateDto = {
        categoria_id: categoriaGasto.id,
        descricao: faker.string.alphanumeric(5),
        previsto: formatValue(
          faker.number.float({
            min: 50,
            max: Number(orcamentoMock.valor_inicial),
            fractionDigits: 2,
          }),
        ),
        observacoes: faker.string.alphanumeric(5),
      };

      const gastoFixo = await request(app.getHttpServer())
      .post(`${apiGlobalPrefix}/orcamentos/${orcamento.body.id}/gastos-fixos`)
      .set('Authorization', `Bearer ${userJwt}`)
        .send(gastoFixoMock)
        .expect(201);

      await request(app.getHttpServer())
      .delete(
        `${apiGlobalPrefix}/orcamentos/${orcamento.body.id}/gastos-fixos/${gastoFixo.body.id}`,
      )
      .set('Authorization', `Bearer ${userJwt}`)
        .expect(200);

      const sum_valor_inicial = formatValue(
        faker.number.float({ min: 100, max: 9999, fractionDigits: 2 }),
      );

      const new_valor_inicial = formatValue(
        Number(orcamentoMock.valor_inicial) + Number(sum_valor_inicial),
      );

      await request(app.getHttpServer())
      .patch(`${apiGlobalPrefix}/orcamentos/${orcamento.body.id}`)
      .set('Authorization', `Bearer ${userJwt}`)
        .send({ valor_inicial: new_valor_inicial });

      const response = await request(app.getHttpServer())
      .get(`${apiGlobalPrefix}/orcamentos/${orcamento.body.id}`)
      .set('Authorization', `Bearer ${userJwt}`)
        .expect(200);

      const valor_inicial = new_valor_inicial;
      const valor_atual = new_valor_inicial;
      const valor_livre = new_valor_inicial;

      expect(response.body).toEqual({
        id: orcamento.body.id,
        nome: orcamentoMock.nome,
        usuario_id: user.id,
        valor_inicial: valor_inicial,
        valor_atual: valor_atual,
        valor_livre: valor_livre,
        data_encerramento: null,
        data_criacao: expect.stringMatching(
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
        ),
        data_atualizacao: expect.stringMatching(
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
        ),
        data_inatividade: null,
        soft_delete: null,
      });
    });

    it("should correctly update valor_inicial, valor_atual, and valor_livre when add an unpaid gasto fixo and update valor_inicial", async () => {
      const orcamentoMock: OrcamentoCreateDto = {
        nome: faker.string.alphanumeric(5),
        valor_inicial: formatValue(
          faker.number.float({ min: 100, max: 9999, fractionDigits: 2 }),
        ),
      };

      const orcamento = await request(app.getHttpServer())
      .post(`${apiGlobalPrefix}/orcamentos`)
      .set('Authorization', `Bearer ${userJwt}`)
        .send(orcamentoMock)
        .expect(201);

      const gastoFixoMock: GastoFixoCreateDto = {
        categoria_id: categoriaGasto.id,
        descricao: faker.string.alphanumeric(5),
        previsto: formatValue(
          faker.number.float({
            min: 50,
            max: Number(orcamentoMock.valor_inicial),
            fractionDigits: 2,
          }),
        ),
        observacoes: faker.string.alphanumeric(5),
      };

      await request(app.getHttpServer())
      .post(`${apiGlobalPrefix}/orcamentos/${orcamento.body.id}/gastos-fixos`)
      .set('Authorization', `Bearer ${userJwt}`)
        .send(gastoFixoMock)
        .expect(201);

      const sum_valor_inicial = formatValue(
        faker.number.float({ min: 100, max: 9999, fractionDigits: 2 }),
      );

      const new_valor_inicial = formatValue(
        Number(orcamentoMock.valor_inicial) + Number(sum_valor_inicial),
      );

      await request(app.getHttpServer())
      .patch(`${apiGlobalPrefix}/orcamentos/${orcamento.body.id}`)
      .set('Authorization', `Bearer ${userJwt}`)
        .send({ valor_inicial: new_valor_inicial });

      const response = await request(app.getHttpServer())
      .get(`${apiGlobalPrefix}/orcamentos/${orcamento.body.id}`)
      .set('Authorization', `Bearer ${userJwt}`)
        .expect(200);

      const valor_inicial = new_valor_inicial;
      const valor_atual = new_valor_inicial;
      const valor_livre = formatValue(
        Number(new_valor_inicial) - Number(gastoFixoMock.previsto),
      );

      expect(response.body).toEqual({
        id: orcamento.body.id,
        nome: orcamentoMock.nome,
        usuario_id: user.id,
        valor_inicial: valor_inicial,
        valor_atual: valor_atual,
        valor_livre: valor_livre,
        data_encerramento: null,
        data_criacao: expect.stringMatching(
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
        ),
        data_atualizacao: expect.stringMatching(
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
        ),
        data_inatividade: null,
        soft_delete: null,
      });
    });

    it("should correctly update valor_inicial, valor_atual, and valor_livre when paying a gasto fixo and update valor_inicial", async () => {
      const orcamentoMock: OrcamentoCreateDto = {
        nome: faker.string.alphanumeric(5),
        valor_inicial: formatValue(
          faker.number.float({ min: 100, max: 9999, fractionDigits: 2 }),
        ),
      };

      const orcamento = await request(app.getHttpServer())
      .post(`${apiGlobalPrefix}/orcamentos`)
      .set('Authorization', `Bearer ${userJwt}`)
        .send(orcamentoMock)
        .expect(201);

      const gastoFixoMock: GastoFixoCreateDto = {
        categoria_id: categoriaGasto.id,
        descricao: faker.string.alphanumeric(5),
        previsto: formatValue(
          faker.number.float({
            min: 50,
            max: Number(orcamentoMock.valor_inicial),
            fractionDigits: 2,
          }),
        ),
        observacoes: faker.string.alphanumeric(5),
      };

      const gastoFixo = await request(app.getHttpServer())
      .post(`${apiGlobalPrefix}/orcamentos/${orcamento.body.id}/gastos-fixos`)
      .set('Authorization', `Bearer ${userJwt}`)
      .send(gastoFixoMock)
        .expect(201);

      const gastoFixoUpdateMock: GastoFixoUpdateDto = {
        valor: formatValue(
          faker.number.float({
            min: 25,
            max: Number(gastoFixoMock.previsto),
            fractionDigits: 2,
          }),
        ),
        data_pgto: new Date(),
      };

      const res = await request(app.getHttpServer())
      .patch(
        `${apiGlobalPrefix}/orcamentos/${orcamento.body.id}/gastos-fixos/${gastoFixo.body.id}`,
      )
      .set('Authorization', `Bearer ${userJwt}`)
        .send(gastoFixoUpdateMock)
        .expect(200);

      const sum_valor_inicial = formatValue(
        faker.number.float({ min: 100, max: 9999, fractionDigits: 2 }),
      );

      const new_valor_inicial = formatValue(
        Number(orcamentoMock.valor_inicial) + Number(sum_valor_inicial),
      );

      await request(app.getHttpServer())
      .patch(`${apiGlobalPrefix}/orcamentos/${orcamento.body.id}`)
      .set('Authorization', `Bearer ${userJwt}`)
        .send({ valor_inicial: new_valor_inicial });

      const response = await request(app.getHttpServer())
      .get(`${apiGlobalPrefix}/orcamentos/${orcamento.body.id}`)
      .set('Authorization', `Bearer ${userJwt}`)
        .expect(200);

      const valor_inicial = new_valor_inicial;
      const valor_atual = formatValue(
        Number(new_valor_inicial) - Number(gastoFixoUpdateMock.valor),
      );
      const valor_livre = formatValue(
        Number(new_valor_inicial) - Number(gastoFixoUpdateMock.valor),
      );

      expect(response.body).toEqual({
        id: orcamento.body.id,
        nome: orcamentoMock.nome,
        usuario_id: user.id,
        valor_inicial: valor_inicial,
        valor_atual: valor_atual,
        valor_livre: valor_livre,
        data_encerramento: null,
        data_criacao: expect.stringMatching(
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
        ),
        data_atualizacao: expect.stringMatching(
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
        ),
        data_inatividade: null,
        soft_delete: null,
      });
    });

    it("should correctly update valor_inicial, valor_atual, and valor_livre when creating a new gasto variado and update valor_inicial", async () => {
      const orcamentoMock: OrcamentoCreateDto = {
        nome: faker.string.alphanumeric(5),
        valor_inicial: formatValue(
          faker.number.float({ min: 100, max: 9999, fractionDigits: 2 }),
        ),
      };

      const orcamento = await request(app.getHttpServer())
      .post(`${apiGlobalPrefix}/orcamentos`)
      .set('Authorization', `Bearer ${userJwt}`)
        .send(orcamentoMock)
        .expect(201);

      const gastoVariadoMock: GastoVariadoCreateDto = {
        categoria_id: categoriaGasto.id,
        descricao: faker.string.alphanumeric(5),
        valor: formatValue(
          faker.number.float({
            min: 50,
            max: Number(orcamentoMock.valor_inicial),
            fractionDigits: 2,
          }),
        ),
        data_pgto: new Date(),
        observacoes: faker.string.alphanumeric(5),
      };

      await request(app.getHttpServer())
      .post(
        `${apiGlobalPrefix}/orcamentos/${orcamento.body.id}/gastos-variados`,
      )
      .set('Authorization', `Bearer ${userJwt}`)
        .send(gastoVariadoMock)
        .expect(201);

      const sum_valor_inicial = formatValue(
        faker.number.float({ min: 100, max: 9999, fractionDigits: 2 }),
      );

      const new_valor_inicial = formatValue(
        Number(orcamentoMock.valor_inicial) + Number(sum_valor_inicial),
      );

      await request(app.getHttpServer())
      .patch(`${apiGlobalPrefix}/orcamentos/${orcamento.body.id}`)
      .set('Authorization', `Bearer ${userJwt}`)
        .send({ valor_inicial: new_valor_inicial });

      const response = await request(app.getHttpServer())
      .get(`${apiGlobalPrefix}/orcamentos/${orcamento.body.id}`)
      .set('Authorization', `Bearer ${userJwt}`)
        .expect(200);

      const valor_inicial = new_valor_inicial;
      const valor_atual = formatValue(
        Number(new_valor_inicial) - Number(gastoVariadoMock.valor),
      );
      const valor_livre = formatValue(
        Number(new_valor_inicial) - Number(gastoVariadoMock.valor),
      );

      expect(response.body).toEqual({
        id: orcamento.body.id,
        nome: orcamentoMock.nome,
        usuario_id: user.id,
        valor_inicial: valor_inicial,
        valor_atual: valor_atual,
        valor_livre: valor_livre,
        data_encerramento: null,
        data_criacao: expect.stringMatching(
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
        ),
        data_atualizacao: expect.stringMatching(
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
        ),
        data_inatividade: null,
        soft_delete: null,
      });
    });
  });
});

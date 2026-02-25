import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { PrismaService } from "../../src/modules/prisma/prisma.service";
import { GastosFixosModule } from "../../src/modules/api/gastos-fixos/gastos-fixos.module";
import { GastoFixoCreateDto } from "../../src/modules/api/gastos-fixos/dtos/GastoFixoCreate.dto";
import { GastoFixoUpdateDto } from "../../src/modules/api/gastos-fixos/dtos/GastoFixoUpdate.dto";
import { globalPipes } from "../../src/pipes/globalPipes";
import { globalFilters } from "../../src/filters/global-filters";
import { globalInterceptors } from "../../src/interceptors/globalInterceptors";
import { runPrismaMigrations } from "../utils/run-prisma-migrations";
import { faker } from "@faker-js/faker";
import { CategoriaGasto, Orcamento, Usuario } from "@prisma/client";
import { OrcamentoCreateDto } from "../../src/modules/api/orcamentos/dtos/OrcamentoCreate.dto";
import { OrcamentosModule } from "../../src/modules/api/orcamentos/orcamentos.module";
import { CategoriaGastoCreateDto } from "../../src/modules/api/categorias-gastos/dtos/CategoriaGastoCreate.dto";
import { CategoriasGastosModule } from "../../src/modules/api/categorias-gastos/categorias-gastos.module";
import { formatValue } from "../utils/format-value";
import { AuthService } from "../../src/modules/api/auth/auth.service";
import { AuthModule } from "../../src/modules/api/auth/auth.module";
import { StatusGasto } from "../../src/modules/api/gastos-fixos/dtos/GastoFixoFind.dto";

jest.setTimeout(10000); // 10 segundos

const apiGlobalPrefix = "/api/v1";

describe("GastosFixosController (v1) (E2E)", () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let authService: AuthService;
  let user: Usuario;
  let userJwt: string;

  let categoriaMock: CategoriaGasto;
  let orcamentoMock: Orcamento;

  beforeAll(async () => {
    await runPrismaMigrations();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        OrcamentosModule,
        GastosFixosModule,
        CategoriasGastosModule,
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

    globalPipes.forEach((gp) => app.useGlobalPipes(gp));
    globalFilters.forEach((gf) => app.useGlobalFilters(gf));
    globalInterceptors.forEach((gi) => app.useGlobalInterceptors(gi));

    await app.init();

    orcamentoMock = await prismaService.orcamento.create({
      data: {
        nome: faker.string.alphanumeric(5),
        valor_inicial: faker.number
          .float({ min: 1000, max: 10000, fractionDigits: 2 })
          .toString(),
        usuario_id: user.id,
      },
    });

    categoriaMock = await prismaService.categoriaGasto.create({
      data: {
        nome: faker.string.alphanumeric(5),
        usuario_id: user.id,
      },
    });
  });

  afterAll(async () => {
    await prismaService.$disconnect();
    await app.close();
  });

  describe(`POST ${apiGlobalPrefix}/gastos-fixos`, () => {
    it("should create a new gasto fixo", async () => {
      const createGastoDto: GastoFixoCreateDto = {
        descricao: faker.string.alphanumeric(5),
        previsto: faker.number
          .float({ min: 1, max: 50, fractionDigits: 2 })
          .toString(),
        categoria_id: categoriaMock.id,
      };

      const response = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/orcamentos/${orcamentoMock.id}/gastos-fixos`)
        .set("Authorization", `Bearer ${userJwt}`)
        .send(createGastoDto)
        .expect(201);

      expect(response.body).toHaveProperty("id");
      expect(response.body.descricao).toBe(createGastoDto.descricao);
      expect(response.body.previsto).toBe(createGastoDto.previsto);
      expect(response.body.categoria_id).toBe(createGastoDto.categoria_id);
      expect(response.body.orcamento_id).toBe(orcamentoMock.id);
    });

    it("should create a new gasto fixo with data_venc hour set to 00:00:00", async () => {
      // Cria uma data com hora qualquer
      const dataVenc = faker.date.future();

      const createGastoDto: GastoFixoCreateDto = {
        descricao: faker.string.alphanumeric(5),
        previsto: faker.number
          .float({ min: 1, max: 50, fractionDigits: 2 })
          .toString(),
        data_venc: dataVenc,
        categoria_id: categoriaMock.id,
      };

      const response = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/orcamentos/${orcamentoMock.id}/gastos-fixos`)
        .set("Authorization", `Bearer ${userJwt}`)
        .send(createGastoDto)
        .expect(201);

      // Verifica campos básicos
      expect(response.body).toHaveProperty("id");
      expect(response.body.descricao).toBe(createGastoDto.descricao);
      expect(response.body.previsto).toBe(createGastoDto.previsto);
      expect(response.body.categoria_id).toBe(createGastoDto.categoria_id);
      expect(response.body.orcamento_id).toBe(orcamentoMock.id);

      // Converte a data retornada para Date
      const returnedDate = new Date(response.body.data_venc);

      // ✅ Compara apenas ano, mês e dia em UTC para ignorar fuso horário
      expect(returnedDate.getUTCFullYear()).toBe(dataVenc.getUTCFullYear());
      expect(returnedDate.getUTCMonth()).toBe(dataVenc.getUTCMonth());
      expect(returnedDate.getUTCDate()).toBe(dataVenc.getUTCDate());

      // ✅ Verifica se a hora foi zerada
      expect(returnedDate.getUTCHours()).toBe(0);
      expect(returnedDate.getUTCMinutes()).toBe(0);
      expect(returnedDate.getUTCSeconds()).toBe(0);
      expect(returnedDate.getUTCMilliseconds()).toBe(0);
    });

    it("should return 400 with correct messages when create a new gasto fixo when all fields as null", async () => {
      const createGastoDto: Required<GastoFixoCreateDto> = {
        descricao: null,
        previsto: null,
        categoria_id: null,
        observacoes: null,
        data_venc: null,
      };

      const response = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/orcamentos/${orcamentoMock.id}/gastos-fixos`)
        .set("Authorization", `Bearer ${userJwt}`)
        .send(createGastoDto)
        .expect(400);

      expect(response.body).toHaveProperty("message");
      expect(Array.isArray(response.body.message)).toBe(true);

      expect(response.body.message).toEqual([
        "descricao should not be empty",
        "descricao must be a string",
        "previsto should not be empty",
        "previsto is not a valid decimal number.",
        "categoria_id should not be empty",
        "categoria_id must be an integer number",
      ]);
    });

    it("should return 400 with correct messages when create a new gasto fixo when all fields as wrong", async () => {
      const createGastoDto: Required<GastoFixoCreateDto> = {
        descricao: faker.number.int({
          min: 100,
          max: 999,
        }) as unknown as string,
        previsto: faker.string.alpha(5),
        data_venc: faker.string.alpha(5) as unknown as Date,
        categoria_id: faker.string.alpha(5) as unknown as number,
        observacoes: faker.number.int() as unknown as string,
      };

      const response = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/orcamentos/${orcamentoMock.id}/gastos-fixos`)
        .set("Authorization", `Bearer ${userJwt}`)
        .send(createGastoDto)
        .expect(400);

      expect(response.body).toHaveProperty("message");
      expect(Array.isArray(response.body.message)).toBe(true);

      expect(response.body.message).toEqual([
        "descricao must be a string",
        "previsto is not a valid decimal number.",
        "categoria_id must be an integer number",
        "observacoes must be a string",
        "data_venc must be a Date instance",
      ]);
    });

    it("should return 404 when categoria gasto does not exists", async () => {
      const createGastoDto: GastoFixoCreateDto = {
        descricao: faker.string.alphanumeric(5),
        previsto: faker.number
          .float({ min: 1, max: 50, fractionDigits: 2 })
          .toString(),
        categoria_id: 999,
      };

      const response = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/orcamentos/${orcamentoMock.id}/gastos-fixos`)
        .set("Authorization", `Bearer ${userJwt}`)
        .send(createGastoDto)
        .expect(404);

      expect(response.body.message).toBe(
        "A categoria informada não foi encontrada.",
      );
    });

    it("should return 404 when categoria gasto was soft deleted", async () => {
      const newCategoria: CategoriaGastoCreateDto = {
        nome: faker.string.alphanumeric(6).toUpperCase(),
      };

      const categoriaResponse = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/categorias-gastos`)
        .set("Authorization", `Bearer ${userJwt}`)
        .send(newCategoria)
        .expect(201);

      await request(app.getHttpServer())
        .delete(
          `${apiGlobalPrefix}/categorias-gastos/${categoriaResponse.body.id}`,
        )
        .set("Authorization", `Bearer ${userJwt}`)
        .expect(200);

      const createGastoDto: GastoFixoCreateDto = {
        descricao: faker.string.alphanumeric(5),
        previsto: faker.number
          .float({ min: 1, max: 50, fractionDigits: 2 })
          .toString(),
        categoria_id: categoriaResponse.body.id,
      };

      const response = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/orcamentos/${orcamentoMock.id}/gastos-fixos`)
        .set("Authorization", `Bearer ${userJwt}`)
        .send(createGastoDto)
        .expect(404);

      expect(response.body.message).toBe(
        "A categoria informada não foi encontrada.",
      );
    });

    it("should return 404 when orcamento does not exists", async () => {
      const createGastoDto: GastoFixoCreateDto = {
        descricao: faker.string.alphanumeric(5),
        previsto: faker.number
          .float({ min: 1, max: 50, fractionDigits: 2 })
          .toString(),
        categoria_id: categoriaMock.id,
      };

      const response = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/orcamentos/999/gastos-fixos`)
        .set("Authorization", `Bearer ${userJwt}`)
        .send(createGastoDto)
        .expect(404);

      expect(response.body.message).toBe(
        "O orçamento informado não foi encontrado.",
      );
    });

    it("should return 404 when orcamento was soft deleted", async () => {
      const createOrcamentoDto: OrcamentoCreateDto = {
        nome: faker.string.alphanumeric(5),
        valor_inicial: formatValue(
          faker.number.float({ min: 1000, max: 5000, fractionDigits: 2 }),
        ),
      };

      const orcamentoResponse = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/orcamentos`)
        .set("Authorization", `Bearer ${userJwt}`)
        .send(createOrcamentoDto)
        .expect(201);

      await request(app.getHttpServer())
        .delete(`${apiGlobalPrefix}/orcamentos/${orcamentoResponse.body.id}`)
        .set("Authorization", `Bearer ${userJwt}`)
        .expect(200);

      const createGastoDto: GastoFixoCreateDto = {
        descricao: faker.string.alphanumeric(5),
        previsto: faker.number
          .float({ min: 1, max: 50, fractionDigits: 2 })
          .toString(),
        categoria_id: categoriaMock.id,
      };

      const response = await request(app.getHttpServer())
        .post(
          `${apiGlobalPrefix}/orcamentos/${orcamentoResponse.body.id}/gastos-fixos`,
        )
        .set("Authorization", `Bearer ${userJwt}`)
        .send(createGastoDto)
        .expect(404);

      expect(response.body.message).toBe(
        "O orçamento informado não foi encontrado.",
      );
    });

    it("should return 400 on passing an invalid field on create a new gasto fixo", async () => {
      const createGastoDto = {
        descricao: faker.string.alphanumeric(5),
        previsto: faker.number
          .float({ min: 1, max: 50, fractionDigits: 2 })
          .toString(),
        categoria_id: categoriaMock.id,
        invalid_field: "invalid",
      } as GastoFixoCreateDto;

      await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/orcamentos/${orcamentoMock.id}/gastos-fixos`)
        .set("Authorization", `Bearer ${userJwt}`)
        .send(createGastoDto)
        .expect(400);
    });
  });

  describe(`GET ${apiGlobalPrefix}/gastos-fixos`, () => {
    it("should return all gastos fixos", async () => {
      const orcamentoMock2: OrcamentoCreateDto = {
        nome: faker.string.alphanumeric(5),
        valor_inicial: faker.number
          .float({ min: 100, max: 999, fractionDigits: 2 })
          .toString(),
      };

      const orcamento2 = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/orcamentos`)
        .set("Authorization", `Bearer ${userJwt}`)
        .send(orcamentoMock2)
        .expect(201);

      const gastoFixoOrcamento2: GastoFixoCreateDto = {
        categoria_id: categoriaMock.id,
        descricao: faker.string.alphanumeric(5),
        previsto: faker.number
          .float({ min: 100, max: 999, fractionDigits: 2 })
          .toString(),
        observacoes: faker.string.alphanumeric(5),
      };

      await request(app.getHttpServer())
        .post(
          `${apiGlobalPrefix}/orcamentos/${orcamento2.body.id}/gastos-fixos`,
        )
        .set("Authorization", `Bearer ${userJwt}`)
        .send(gastoFixoOrcamento2)
        .expect(201);

      const responseOrcamentoMock = await request(app.getHttpServer())
        .get(`${apiGlobalPrefix}/orcamentos/${orcamentoMock.id}/gastos-fixos`)
        .set("Authorization", `Bearer ${userJwt}`)
        .expect(200);

      const responseOrcamentoMock2 = await request(app.getHttpServer())
        .get(`${apiGlobalPrefix}/orcamentos/${orcamento2.body.id}/gastos-fixos`)
        .set("Authorization", `Bearer ${userJwt}`)
        .expect(200);

      const orcamento1Ok = responseOrcamentoMock.body.every(
        (reg) => reg.orcamento_id === orcamentoMock.id,
      );
      const orcamento2Ok = responseOrcamentoMock2.body.every(
        (reg) => reg.orcamento_id === orcamento2.body.id,
      );

      expect(orcamento1Ok).toBeTruthy();
      expect(orcamento2Ok).toBeTruthy();
    });

    it("should not return soft deleted gasto fixo", async () => {
      const orcamentoMock: OrcamentoCreateDto = {
        nome: faker.string.alphanumeric(5),
        valor_inicial: faker.number
          .float({ min: 100, max: 999, fractionDigits: 2 })
          .toString(),
      };

      const orcamentoResponse = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/orcamentos`)
        .set("Authorization", `Bearer ${userJwt}`)
        .send(orcamentoMock)
        .expect(201);

      const gastoFixoOrcamento: GastoFixoCreateDto = {
        categoria_id: categoriaMock.id,
        descricao: faker.string.alphanumeric(5),
        previsto: faker.number
          .float({ min: 100, max: 999, fractionDigits: 2 })
          .toString(),
        observacoes: faker.string.alphanumeric(5),
      };

      const gastoFixoResponse = await request(app.getHttpServer())
        .post(
          `${apiGlobalPrefix}/orcamentos/${orcamentoResponse.body.id}/gastos-fixos`,
        )
        .set("Authorization", `Bearer ${userJwt}`)
        .send(gastoFixoOrcamento)
        .expect(201);

      await request(app.getHttpServer())
        .delete(
          `${apiGlobalPrefix}/orcamentos/${orcamentoResponse.body.id}/gastos-fixos/${gastoFixoResponse.body.id}`,
        )
        .set("Authorization", `Bearer ${userJwt}`)
        .expect(200);

      const response = await request(app.getHttpServer())
        .get(
          `${apiGlobalPrefix}/orcamentos/${orcamentoResponse.body.id}/gastos-fixos`,
        )
        .set("Authorization", `Bearer ${userJwt}`)
        .expect(200);

      expect(response.body.length).toBe(0);
    });

    it("should return 404 if orcamento was soft deleted", async () => {
      const orcamentoMock: OrcamentoCreateDto = {
        nome: faker.string.alphanumeric(5),
        valor_inicial: faker.number
          .float({ min: 100, max: 999, fractionDigits: 2 })
          .toString(),
      };

      const orcamentoResponse = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/orcamentos`)
        .set("Authorization", `Bearer ${userJwt}`)
        .send(orcamentoMock)
        .expect(201);

      const gastoFixoOrcamento: GastoFixoCreateDto = {
        categoria_id: categoriaMock.id,
        descricao: faker.string.alphanumeric(5),
        previsto: faker.number
          .float({ min: 100, max: 999, fractionDigits: 2 })
          .toString(),
        observacoes: faker.string.alphanumeric(5),
      };

      await request(app.getHttpServer())
        .post(
          `${apiGlobalPrefix}/orcamentos/${orcamentoResponse.body.id}/gastos-fixos`,
        )
        .set("Authorization", `Bearer ${userJwt}`)
        .send(gastoFixoOrcamento)
        .expect(201);

      await request(app.getHttpServer())
        .delete(`${apiGlobalPrefix}/orcamentos/${orcamentoResponse.body.id}`)
        .set("Authorization", `Bearer ${userJwt}`)
        .expect(200);

      const response = await request(app.getHttpServer())
        .get(
          `${apiGlobalPrefix}/orcamentos/${orcamentoResponse.body.id}/gastos-fixos`,
        )
        .set("Authorization", `Bearer ${userJwt}`)
        .expect(404);

      expect(response.body.message).toBe(
        "O orçamento informado não foi encontrado.",
      );
    });
  });

  describe(`GET ${apiGlobalPrefix}/gastos-fixos/:id`, () => {
    it("should return a single gasto fixo", async () => {
      const createGastoDto: GastoFixoCreateDto = {
        descricao: faker.string.alphanumeric(5),
        previsto: faker.number
          .float({ min: 1, max: 50, fractionDigits: 2 })
          .toString(),
        categoria_id: categoriaMock.id,
      };

      const createResponse = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/orcamentos/${orcamentoMock.id}/gastos-fixos`)
        .set("Authorization", `Bearer ${userJwt}`)
        .send(createGastoDto)
        .expect(201);

      const gastoId = createResponse.body.id;

      const response = await request(app.getHttpServer())
        .get(
          `${apiGlobalPrefix}/orcamentos/${orcamentoMock.id}/gastos-fixos/${gastoId}`,
        )
        .set("Authorization", `Bearer ${userJwt}`)
        .expect(200);

      expect(response.body.id).toBe(gastoId);
      expect(response.body.descricao).toBe(createGastoDto.descricao);
      expect(response.body.previsto).toBe(createGastoDto.previsto);
      expect(response.body.categoria_id).toBe(createGastoDto.categoria_id);
      expect(response.body.orcamento_id).toBe(orcamentoMock.id);
    });

    it("should return a 404 error if the gasto fixo exists but does not belong to the specified orcamento", async () => {
      const orcamentoMock2: OrcamentoCreateDto = {
        nome: faker.string.alphanumeric(5),
        valor_inicial: faker.number
          .float({ min: 100, max: 999, fractionDigits: 2 })
          .toString(),
      };

      const orcamento2 = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/orcamentos`)
        .set("Authorization", `Bearer ${userJwt}`)
        .send(orcamentoMock2)
        .expect(201);

      const createGastoDto: GastoFixoCreateDto = {
        descricao: faker.string.alphanumeric(5),
        previsto: faker.number
          .float({ min: 1, max: 50, fractionDigits: 2 })
          .toString(),
        categoria_id: categoriaMock.id,
      };

      const createResponse = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/orcamentos/${orcamentoMock.id}/gastos-fixos`)
        .set("Authorization", `Bearer ${userJwt}`)
        .send(createGastoDto)
        .expect(201);

      const gastoId = createResponse.body.id;

      await request(app.getHttpServer())
        .get(
          `${apiGlobalPrefix}/orcamentos/${orcamento2.body.id}/gastos-fixos/${gastoId}`,
        )
        .set("Authorization", `Bearer ${userJwt}`)
        .expect(404);
    });

    it("should return 404 if gasto fixo not found", async () => {
      const response = await request(app.getHttpServer())
        .get(
          `${apiGlobalPrefix}/orcamentos/${orcamentoMock.id}/gastos-fixos/9999`,
        )
        .set("Authorization", `Bearer ${userJwt}`)
        .expect(404);

      expect(response.body.message).toBe("Not Found");
    });

    it("should return 404 if gasto fixo was soft deleted", async () => {
      const orcamentoMock: OrcamentoCreateDto = {
        nome: faker.string.alphanumeric(5),
        valor_inicial: faker.number
          .float({ min: 100, max: 999, fractionDigits: 2 })
          .toString(),
      };

      const orcamentoResponse = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/orcamentos`)
        .set("Authorization", `Bearer ${userJwt}`)
        .send(orcamentoMock)
        .expect(201);

      const createGastoDto: GastoFixoCreateDto = {
        descricao: faker.string.alphanumeric(5),
        previsto: faker.number
          .float({ min: 1, max: 50, fractionDigits: 2 })
          .toString(),
        categoria_id: categoriaMock.id,
      };

      const createResponse = await request(app.getHttpServer())
        .post(
          `${apiGlobalPrefix}/orcamentos/${orcamentoResponse.body.id}/gastos-fixos`,
        )
        .set("Authorization", `Bearer ${userJwt}`)
        .send(createGastoDto)
        .expect(201);

      const gastoId = createResponse.body.id;

      await request(app.getHttpServer())
        .delete(
          `${apiGlobalPrefix}/orcamentos/${orcamentoResponse.body.id}/gastos-fixos/${gastoId}`,
        )
        .set("Authorization", `Bearer ${userJwt}`)
        .expect(200);

      const response = await request(app.getHttpServer())
        .get(
          `${apiGlobalPrefix}/orcamentos/${orcamentoResponse.body.id}/gastos-fixos/${gastoId}`,
        )
        .set("Authorization", `Bearer ${userJwt}`)
        .expect(404);

      expect(response.body.message).toBe("Not Found");
    });

    it("should return 404 if orcamento was soft deleted", async () => {
      const orcamentoMock: OrcamentoCreateDto = {
        nome: faker.string.alphanumeric(5),
        valor_inicial: faker.number
          .float({ min: 100, max: 999, fractionDigits: 2 })
          .toString(),
      };

      const orcamentoResponse = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/orcamentos`)
        .set("Authorization", `Bearer ${userJwt}`)
        .send(orcamentoMock)
        .expect(201);

      const createGastoDto: GastoFixoCreateDto = {
        descricao: faker.string.alphanumeric(5),
        previsto: faker.number
          .float({ min: 1, max: 50, fractionDigits: 2 })
          .toString(),
        categoria_id: categoriaMock.id,
      };

      const createResponse = await request(app.getHttpServer())
        .post(
          `${apiGlobalPrefix}/orcamentos/${orcamentoResponse.body.id}/gastos-fixos`,
        )
        .set("Authorization", `Bearer ${userJwt}`)
        .send(createGastoDto)
        .expect(201);

      const gastoId = createResponse.body.id;

      await request(app.getHttpServer())
        .delete(`${apiGlobalPrefix}/orcamentos/${orcamentoResponse.body.id}`)
        .set("Authorization", `Bearer ${userJwt}`)
        .expect(200);

      const response = await request(app.getHttpServer())
        .get(
          `${apiGlobalPrefix}/orcamentos/${orcamentoResponse.body.id}/gastos-fixos/${gastoId}`,
        )
        .set("Authorization", `Bearer ${userJwt}`)
        .expect(404);

      expect(response.body.message).toBe(
        "O orçamento informado não foi encontrado.",
      );
    });

    it("should filter gastos fixos by description (partial search)", async () => {
      // Arrange
      const orcamentoMock: OrcamentoCreateDto = {
        nome: faker.string.alphanumeric(5),
        valor_inicial: faker.number
          .float({ min: 1000, max: 5000, fractionDigits: 2 })
          .toString(),
      };

      const orcamentoResponse = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/orcamentos`)
        .set("Authorization", `Bearer ${userJwt}`)
        .send(orcamentoMock)
        .expect(201);

      const testOrcamento = orcamentoResponse.body;

      const gastoFixo1: GastoFixoCreateDto = {
        categoria_id: categoriaMock.id,
        descricao: "Internet - Teste",
        previsto: "150.00",
      };

      const gastoFixo2: GastoFixoCreateDto = {
        categoria_id: categoriaMock.id,
        descricao: "Internet - Teste 2",
        previsto: "150.00",
      };

      const gastoFixo3: GastoFixoCreateDto = {
        categoria_id: categoriaMock.id,
        descricao: "Água - Teste",
        previsto: "80.00",
      };

      await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/orcamentos/${testOrcamento.id}/gastos-fixos`)
        .set("Authorization", `Bearer ${userJwt}`)
        .send(gastoFixo1)
        .expect(201);

      await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/orcamentos/${testOrcamento.id}/gastos-fixos`)
        .set("Authorization", `Bearer ${userJwt}`)
        .send(gastoFixo2)
        .expect(201);

      await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/orcamentos/${testOrcamento.id}/gastos-fixos`)
        .set("Authorization", `Bearer ${userJwt}`)
        .send(gastoFixo3)
        .expect(201);

      // Act
      const response = await request(app.getHttpServer())
        .get(`${apiGlobalPrefix}/orcamentos/${testOrcamento.id}/gastos-fixos`)
        .query({ descricao: "Internet" })
        .set("Authorization", `Bearer ${userJwt}`)
        .expect(200);

      // Assert
      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBe(2);
      expect(
        response.body.every((gasto) => gasto.descricao.includes("Internet")),
      ).toBeTruthy();
      expect(
        response.body.every((gasto) => gasto.orcamento_id === testOrcamento.id),
      ).toBeTruthy();
    });

    it("should filter gastos fixos by status PAGO", async () => {
      // Arrange
      const orcamentoMock: OrcamentoCreateDto = {
        nome: faker.string.alphanumeric(5),
        valor_inicial: faker.number
          .float({ min: 1000, max: 5000, fractionDigits: 2 })
          .toString(),
      };

      const orcamentoResponse = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/orcamentos`)
        .set("Authorization", `Bearer ${userJwt}`)
        .send(orcamentoMock)
        .expect(201);

      const testOrcamento = orcamentoResponse.body;

      const gastoFixoPago: GastoFixoCreateDto = {
        categoria_id: categoriaMock.id,
        descricao: faker.string.alphanumeric(5),
        previsto: "150.00",
      };

      const gastoFixoNaoPago: GastoFixoCreateDto = {
        categoria_id: categoriaMock.id,
        descricao: faker.string.alphanumeric(5),
        previsto: "150.00",
      };

      const responsePago = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/orcamentos/${testOrcamento.id}/gastos-fixos`)
        .set("Authorization", `Bearer ${userJwt}`)
        .send(gastoFixoPago)
        .expect(201);

      await request(app.getHttpServer())
        .patch(
          `${apiGlobalPrefix}/orcamentos/${testOrcamento.id}/gastos-fixos/${responsePago.body.id}`,
        )
        .set("Authorization", `Bearer ${userJwt}`)
        .send({ data_pgto: new Date(), valor: "150.00" } as GastoFixoUpdateDto)
        .expect(200);

      await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/orcamentos/${testOrcamento.id}/gastos-fixos`)
        .set("Authorization", `Bearer ${userJwt}`)
        .send(gastoFixoNaoPago)
        .expect(201);

      // Act
      const response = await request(app.getHttpServer())
        .get(`${apiGlobalPrefix}/orcamentos/${testOrcamento.id}/gastos-fixos`)
        .query({ status: StatusGasto.PAGO })
        .set("Authorization", `Bearer ${userJwt}`)
        .expect(200);

      // Assert
      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBe(1);
      expect(response.body[0].valor).not.toBeNull();
      expect(response.body[0].data_pgto).not.toBeNull();
      expect(response.body[0].orcamento_id).toBe(testOrcamento.id);
    });

    it("should filter gastos fixos by status NAO_PAGO", async () => {
      // Arrange
      const orcamentoMock: OrcamentoCreateDto = {
        nome: faker.string.alphanumeric(5),
        valor_inicial: faker.number
          .float({ min: 1000, max: 5000, fractionDigits: 2 })
          .toString(),
      };

      const orcamentoResponse = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/orcamentos`)
        .set("Authorization", `Bearer ${userJwt}`)
        .send(orcamentoMock)
        .expect(201);

      const testOrcamento = orcamentoResponse.body;

      const gastoFixoPago: GastoFixoCreateDto = {
        categoria_id: categoriaMock.id,
        descricao: faker.string.alphanumeric(5),
        previsto: "150.00",
      };

      const gastoFixoNaoPago: GastoFixoCreateDto = {
        categoria_id: categoriaMock.id,
        descricao: faker.string.alphanumeric(5),
        previsto: "150.00",
      };

      const responsePago = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/orcamentos/${testOrcamento.id}/gastos-fixos`)
        .set("Authorization", `Bearer ${userJwt}`)
        .send(gastoFixoPago)
        .expect(201);

      await request(app.getHttpServer())
        .patch(
          `${apiGlobalPrefix}/orcamentos/${testOrcamento.id}/gastos-fixos/${responsePago.body.id}`,
        )
        .set("Authorization", `Bearer ${userJwt}`)
        .send({ data_pgto: new Date(), valor: "150.00" } as GastoFixoUpdateDto)
        .expect(200);

      await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/orcamentos/${testOrcamento.id}/gastos-fixos`)
        .set("Authorization", `Bearer ${userJwt}`)
        .send(gastoFixoNaoPago)
        .expect(201);

      // Act
      const response = await request(app.getHttpServer())
        .get(`${apiGlobalPrefix}/orcamentos/${testOrcamento.id}/gastos-fixos`)
        .query({ status: StatusGasto.NAO_PAGO })
        .set("Authorization", `Bearer ${userJwt}`)
        .expect(200);

      // Assert
      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBe(1);
      expect(response.body[0].valor).toBeNull();
      expect(response.body[0].data_pgto).toBeNull();
      expect(response.body[0].orcamento_id).toBe(testOrcamento.id);
    });

    it("should filter gastos fixos by exact payment date", async () => {
      // Arrange
      const orcamentoMock: OrcamentoCreateDto = {
        nome: faker.string.alphanumeric(5),
        valor_inicial: faker.number
          .float({ min: 1000, max: 5000, fractionDigits: 2 })
          .toString(),
      };

      const orcamentoResponse = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/orcamentos`)
        .set("Authorization", `Bearer ${userJwt}`)
        .send(orcamentoMock)
        .expect(201);

      const testOrcamento = orcamentoResponse.body;

      const dataBusca = new Date("2026-02-10");

      const gastoFixo1: GastoFixoCreateDto = {
        categoria_id: categoriaMock.id,
        descricao: faker.string.alphanumeric(5),
        previsto: "150.00",
      };

      const gastoFixo2: GastoFixoCreateDto = {
        categoria_id: categoriaMock.id,
        descricao: faker.string.alphanumeric(5),
        previsto: "150.00",
      };

      const gastoPago1 = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/orcamentos/${testOrcamento.id}/gastos-fixos`)
        .set("Authorization", `Bearer ${userJwt}`)
        .send(gastoFixo1)
        .expect(201);

      await request(app.getHttpServer())
        .patch(
          `${apiGlobalPrefix}/orcamentos/${testOrcamento.id}/gastos-fixos/${gastoPago1.body.id}`,
        )
        .set("Authorization", `Bearer ${userJwt}`)
        .send({ data_pgto: dataBusca, valor: "150.00" } as GastoFixoUpdateDto)
        .expect(200);

      const gastoPago2 = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/orcamentos/${testOrcamento.id}/gastos-fixos`)
        .set("Authorization", `Bearer ${userJwt}`)
        .send(gastoFixo2)
        .expect(201);

      await request(app.getHttpServer())
        .patch(
          `${apiGlobalPrefix}/orcamentos/${testOrcamento.id}/gastos-fixos/${gastoPago2.body.id}`,
        )
        .set("Authorization", `Bearer ${userJwt}`)
        .send({
          data_pgto: new Date("2026-02-15"),
          valor: "150.00",
        } as GastoFixoUpdateDto)
        .expect(200);

      // Act
      const response = await request(app.getHttpServer())
        .get(`${apiGlobalPrefix}/orcamentos/${testOrcamento.id}/gastos-fixos`)
        .query({ data_pgto: "2026-02-10" })
        .set("Authorization", `Bearer ${userJwt}`)
        .expect(200);

      // Assert
      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBe(1);

      const dataPgtoReturned = new Date(response.body[0].data_pgto)
        .toISOString()
        .split("T")[0];
      expect(dataPgtoReturned).toBe("2026-02-10");
      expect(response.body[0].orcamento_id).toBe(testOrcamento.id);
    });

    it("should filter gastos fixos by payment date range with only start date", async () => {
      // Arrange
      const orcamentoMock: OrcamentoCreateDto = {
        nome: faker.string.alphanumeric(5),
        valor_inicial: faker.number
          .float({ min: 1000, max: 5000, fractionDigits: 2 })
          .toString(),
      };

      const orcamentoResponse = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/orcamentos`)
        .set("Authorization", `Bearer ${userJwt}`)
        .send(orcamentoMock)
        .expect(201);

      const testOrcamento = orcamentoResponse.body;

      // Criar gastos não pagos primeiro
      const gastoFixo1: GastoFixoCreateDto = {
        categoria_id: categoriaMock.id,
        descricao: faker.string.alphanumeric(5),
        previsto: "150.00",
      };

      const gastoFixo2: GastoFixoCreateDto = {
        categoria_id: categoriaMock.id,
        descricao: faker.string.alphanumeric(5),
        previsto: "150.00",
      };

      const gastoFixo3: GastoFixoCreateDto = {
        categoria_id: categoriaMock.id,
        descricao: faker.string.alphanumeric(5),
        previsto: "150.00",
      };

      // Criar gasto 1 (data: 2026-02-10)
      const gasto1 = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/orcamentos/${testOrcamento.id}/gastos-fixos`)
        .set("Authorization", `Bearer ${userJwt}`)
        .send(gastoFixo1)
        .expect(201);

      await request(app.getHttpServer())
        .patch(
          `${apiGlobalPrefix}/orcamentos/${testOrcamento.id}/gastos-fixos/${gasto1.body.id}`,
        )
        .set("Authorization", `Bearer ${userJwt}`)
        .send({
          data_pgto: new Date("2026-02-10"),
          valor: "150.00",
        } as GastoFixoUpdateDto)
        .expect(200);

      // Criar gasto 2 (data: 2026-02-15)
      const gasto2 = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/orcamentos/${testOrcamento.id}/gastos-fixos`)
        .set("Authorization", `Bearer ${userJwt}`)
        .send(gastoFixo2)
        .expect(201);

      await request(app.getHttpServer())
        .patch(
          `${apiGlobalPrefix}/orcamentos/${testOrcamento.id}/gastos-fixos/${gasto2.body.id}`,
        )
        .set("Authorization", `Bearer ${userJwt}`)
        .send({
          data_pgto: new Date("2026-02-15"),
          valor: "150.00",
        } as GastoFixoUpdateDto)
        .expect(200);

      // Criar gasto 3 (data: 2026-02-20)
      const gasto3 = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/orcamentos/${testOrcamento.id}/gastos-fixos`)
        .set("Authorization", `Bearer ${userJwt}`)
        .send(gastoFixo3)
        .expect(201);

      await request(app.getHttpServer())
        .patch(
          `${apiGlobalPrefix}/orcamentos/${testOrcamento.id}/gastos-fixos/${gasto3.body.id}`,
        )
        .set("Authorization", `Bearer ${userJwt}`)
        .send({
          data_pgto: new Date("2026-02-20"),
          valor: "150.00",
        } as GastoFixoUpdateDto)
        .expect(200);

      // Act
      const response = await request(app.getHttpServer())
        .get(`${apiGlobalPrefix}/orcamentos/${testOrcamento.id}/gastos-fixos`)
        .query({ data_pgto_inicio: "2026-02-15" })
        .set("Authorization", `Bearer ${userJwt}`)
        .expect(200);

      // Assert
      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBe(2); // Deve retornar gastos de 15/02 e 20/02

      response.body.forEach((gasto) => {
        const dataPgto = new Date(gasto.data_pgto).toISOString().split("T")[0];
        expect(dataPgto >= "2026-02-15").toBeTruthy();
        expect(gasto.orcamento_id).toBe(testOrcamento.id);
      });
    });

    it("should filter gastos fixos by payment date range with only end date", async () => {
      // Arrange
      const orcamentoMock: OrcamentoCreateDto = {
        nome: faker.string.alphanumeric(5),
        valor_inicial: faker.number
          .float({ min: 1000, max: 5000, fractionDigits: 2 })
          .toString(),
      };

      const orcamentoResponse = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/orcamentos`)
        .set("Authorization", `Bearer ${userJwt}`)
        .send(orcamentoMock)
        .expect(201);

      const testOrcamento = orcamentoResponse.body;

      // Criar gastos não pagos primeiro
      const gastoFixo1: GastoFixoCreateDto = {
        categoria_id: categoriaMock.id,
        descricao: faker.string.alphanumeric(5),
        previsto: "150.00",
      };

      const gastoFixo2: GastoFixoCreateDto = {
        categoria_id: categoriaMock.id,
        descricao: faker.string.alphanumeric(5),
        previsto: "150.00",
      };

      const gastoFixo3: GastoFixoCreateDto = {
        categoria_id: categoriaMock.id,
        descricao: faker.string.alphanumeric(5),
        previsto: "150.00",
      };

      // Criar gasto 1 (data: 2026-02-10)
      const gasto1 = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/orcamentos/${testOrcamento.id}/gastos-fixos`)
        .set("Authorization", `Bearer ${userJwt}`)
        .send(gastoFixo1)
        .expect(201);

      await request(app.getHttpServer())
        .patch(
          `${apiGlobalPrefix}/orcamentos/${testOrcamento.id}/gastos-fixos/${gasto1.body.id}`,
        )
        .set("Authorization", `Bearer ${userJwt}`)
        .send({
          data_pgto: new Date("2026-02-10"),
          valor: "150.00",
        } as GastoFixoUpdateDto)
        .expect(200);

      // Criar gasto 2 (data: 2026-02-15)
      const gasto2 = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/orcamentos/${testOrcamento.id}/gastos-fixos`)
        .set("Authorization", `Bearer ${userJwt}`)
        .send(gastoFixo2)
        .expect(201);

      await request(app.getHttpServer())
        .patch(
          `${apiGlobalPrefix}/orcamentos/${testOrcamento.id}/gastos-fixos/${gasto2.body.id}`,
        )
        .set("Authorization", `Bearer ${userJwt}`)
        .send({
          data_pgto: new Date("2026-02-15"),
          valor: "150.00",
        } as GastoFixoUpdateDto)
        .expect(200);

      // Criar gasto 3 (data: 2026-02-20)
      const gasto3 = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/orcamentos/${testOrcamento.id}/gastos-fixos`)
        .set("Authorization", `Bearer ${userJwt}`)
        .send(gastoFixo3)
        .expect(201);

      await request(app.getHttpServer())
        .patch(
          `${apiGlobalPrefix}/orcamentos/${testOrcamento.id}/gastos-fixos/${gasto3.body.id}`,
        )
        .set("Authorization", `Bearer ${userJwt}`)
        .send({
          data_pgto: new Date("2026-02-20"),
          valor: "150.00",
        } as GastoFixoUpdateDto)
        .expect(200);

      // Act
      const response = await request(app.getHttpServer())
        .get(`${apiGlobalPrefix}/orcamentos/${testOrcamento.id}/gastos-fixos`)
        .query({ data_pgto_fim: "2026-02-15" })
        .set("Authorization", `Bearer ${userJwt}`)
        .expect(200);

      // Assert
      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBe(2); // Deve retornar gastos de 10/02 e 15/02

      response.body.forEach((gasto) => {
        const dataPgto = new Date(gasto.data_pgto).toISOString().split("T")[0];
        expect(dataPgto <= "2026-02-15").toBeTruthy();
        expect(gasto.orcamento_id).toBe(testOrcamento.id);
      });
    });

    it("should filter gastos fixos by overdue (vencido = true)", async () => {
      // Arrange
      const orcamentoMock: OrcamentoCreateDto = {
        nome: faker.string.alphanumeric(5),
        valor_inicial: faker.number
          .float({ min: 1000, max: 5000, fractionDigits: 2 })
          .toString(),
      };

      const orcamentoResponse = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/orcamentos`)
        .set("Authorization", `Bearer ${userJwt}`)
        .send(orcamentoMock)
        .expect(201);

      const testOrcamento = orcamentoResponse.body;

      // Data de vencimento no passado
      const dataPassada = new Date();
      dataPassada.setMonth(dataPassada.getMonth() - 1);

      // Data de vencimento no futuro
      const dataFutura = new Date();
      dataFutura.setMonth(dataFutura.getMonth() + 1);

      // Criar gastos não pagos primeiro
      const gastoVencido: GastoFixoCreateDto = {
        categoria_id: categoriaMock.id,
        descricao: "Gasto Vencido",
        previsto: "150.00",
        data_venc: dataPassada,
      };

      const gastoNaoVencido: GastoFixoCreateDto = {
        categoria_id: categoriaMock.id,
        descricao: "Gasto Não Vencido",
        previsto: "150.00",
        data_venc: dataFutura,
      };

      await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/orcamentos/${testOrcamento.id}/gastos-fixos`)
        .set("Authorization", `Bearer ${userJwt}`)
        .send(gastoVencido)
        .expect(201);

      await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/orcamentos/${testOrcamento.id}/gastos-fixos`)
        .set("Authorization", `Bearer ${userJwt}`)
        .send(gastoNaoVencido)
        .expect(201);

      // Act
      const response = await request(app.getHttpServer())
        .get(`${apiGlobalPrefix}/orcamentos/${testOrcamento.id}/gastos-fixos`)
        .query({ vencido: true })
        .set("Authorization", `Bearer ${userJwt}`)
        .expect(200);

      // Assert
      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBe(1);
      expect(response.body[0].descricao).toBe("Gasto Vencido");
      expect(response.body[0].orcamento_id).toBe(testOrcamento.id);

      // Verificar se a data de vencimento é anterior à data atual
      const hoje = new Date();
      expect(new Date(response.body[0].data_venc) < hoje).toBeTruthy();
    });

    it("should filter gastos fixos by not overdue (vencido = false)", async () => {
      // Arrange
      const orcamentoMock: OrcamentoCreateDto = {
        nome: faker.string.alphanumeric(5),
        valor_inicial: faker.number
          .float({ min: 1000, max: 5000, fractionDigits: 2 })
          .toString(),
      };

      const orcamentoResponse = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/orcamentos`)
        .set("Authorization", `Bearer ${userJwt}`)
        .send(orcamentoMock)
        .expect(201);

      const testOrcamento = orcamentoResponse.body;

      // Data de vencimento no passado
      const dataPassada = new Date();
      dataPassada.setMonth(dataPassada.getMonth() - 1);

      // Data de vencimento no futuro
      const dataFutura = new Date();
      dataFutura.setMonth(dataFutura.getMonth() + 1);

      // Criar gastos não pagos primeiro
      const gastoVencido: GastoFixoCreateDto = {
        categoria_id: categoriaMock.id,
        descricao: "Gasto Vencido",
        previsto: "150.00",
        data_venc: dataPassada,
      };

      const gastoNaoVencido: GastoFixoCreateDto = {
        categoria_id: categoriaMock.id,
        descricao: "Gasto Não Vencido",
        previsto: "150.00",
        data_venc: dataFutura,
      };

      await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/orcamentos/${testOrcamento.id}/gastos-fixos`)
        .set("Authorization", `Bearer ${userJwt}`)
        .send(gastoVencido)
        .expect(201);

      await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/orcamentos/${testOrcamento.id}/gastos-fixos`)
        .set("Authorization", `Bearer ${userJwt}`)
        .send(gastoNaoVencido)
        .expect(201);

      // Act
      const response = await request(app.getHttpServer())
        .get(`${apiGlobalPrefix}/orcamentos/${testOrcamento.id}/gastos-fixos`)
        .query({ vencido: false })
        .set("Authorization", `Bearer ${userJwt}`)
        .expect(200);

      // Assert
      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBe(1);
      expect(response.body[0].descricao).toBe("Gasto Não Vencido");
      expect(response.body[0].orcamento_id).toBe(testOrcamento.id);

      // Verificar se a data de vencimento é futura
      const hoje = new Date();
      expect(new Date(response.body[0].data_venc) >= hoje).toBeTruthy();
    });

    it("should filter gastos fixos by not overdue (vencido = false)", async () => {
      // Arrange
      const orcamentoMock: OrcamentoCreateDto = {
        nome: faker.string.alphanumeric(5),
        valor_inicial: faker.number
          .float({ min: 1000, max: 5000, fractionDigits: 2 })
          .toString(),
      };

      const orcamentoResponse = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/orcamentos`)
        .set("Authorization", `Bearer ${userJwt}`)
        .send(orcamentoMock)
        .expect(201);

      const testOrcamento = orcamentoResponse.body;

      // Data de vencimento no passado
      const dataPassada = new Date();
      dataPassada.setMonth(dataPassada.getMonth() - 1);

      // Data de vencimento no futuro
      const dataFutura = new Date();
      dataFutura.setMonth(dataFutura.getMonth() + 1);

      // Criar gastos não pagos primeiro
      const gastoVencido: GastoFixoCreateDto = {
        categoria_id: categoriaMock.id,
        descricao: "Gasto Vencido",
        previsto: "150.00",
        data_venc: dataPassada,
      };

      const gastoNaoVencido: GastoFixoCreateDto = {
        categoria_id: categoriaMock.id,
        descricao: "Gasto Não Vencido",
        previsto: "150.00",
        data_venc: dataFutura,
      };

      await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/orcamentos/${testOrcamento.id}/gastos-fixos`)
        .set("Authorization", `Bearer ${userJwt}`)
        .send(gastoVencido)
        .expect(201);

      await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/orcamentos/${testOrcamento.id}/gastos-fixos`)
        .set("Authorization", `Bearer ${userJwt}`)
        .send(gastoNaoVencido)
        .expect(201);

      // Act
      const response = await request(app.getHttpServer())
        .get(`${apiGlobalPrefix}/orcamentos/${testOrcamento.id}/gastos-fixos`)
        .query({ vencido: false })
        .set("Authorization", `Bearer ${userJwt}`)
        .expect(200);

      // Assert
      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBe(1);
      expect(response.body[0].descricao).toBe("Gasto Não Vencido");
      expect(response.body[0].orcamento_id).toBe(testOrcamento.id);

      // Verificar se a data de vencimento é futura
      const hoje = new Date();
      expect(new Date(response.body[0].data_venc) >= hoje).toBeTruthy();
    });

    it("should filter gastos fixos by category name", async () => {
      // Arrange
      const orcamentoMock: OrcamentoCreateDto = {
        nome: faker.string.alphanumeric(5),
        valor_inicial: faker.number
          .float({ min: 1000, max: 5000, fractionDigits: 2 })
          .toString(),
      };

      const orcamentoResponse = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/orcamentos`)
        .set("Authorization", `Bearer ${userJwt}`)
        .send(orcamentoMock)
        .expect(201);

      const testOrcamento = orcamentoResponse.body;

      // Criar categoria específica para este teste
      const categoriaEspecifica: CategoriaGastoCreateDto = {
        nome: "Categoria Teste Filtro",
      };

      const categoriaResponse = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/categorias-gastos`)
        .set("Authorization", `Bearer ${userJwt}`)
        .send(categoriaEspecifica)
        .expect(201);

      // Criar gastos não pagos primeiro
      const gastoFixo1: GastoFixoCreateDto = {
        categoria_id: categoriaResponse.body.id,
        descricao: faker.string.alphanumeric(5),
        previsto: "150.00",
      };

      const gastoFixo2: GastoFixoCreateDto = {
        categoria_id: categoriaMock.id, // Categoria padrão
        descricao: faker.string.alphanumeric(5),
        previsto: "150.00",
      };

      // Criar gasto 1 (categoria específica)
      const gasto1 = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/orcamentos/${testOrcamento.id}/gastos-fixos`)
        .set("Authorization", `Bearer ${userJwt}`)
        .send(gastoFixo1)
        .expect(201);

      await request(app.getHttpServer())
        .patch(
          `${apiGlobalPrefix}/orcamentos/${testOrcamento.id}/gastos-fixos/${gasto1.body.id}`,
        )
        .set("Authorization", `Bearer ${userJwt}`)
        .send({
          data_pgto: new Date(),
          valor: "150.00",
        } as GastoFixoUpdateDto)
        .expect(200);

      // Criar gasto 2 (categoria padrão)
      const gasto2 = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/orcamentos/${testOrcamento.id}/gastos-fixos`)
        .set("Authorization", `Bearer ${userJwt}`)
        .send(gastoFixo2)
        .expect(201);

      await request(app.getHttpServer())
        .patch(
          `${apiGlobalPrefix}/orcamentos/${testOrcamento.id}/gastos-fixos/${gasto2.body.id}`,
        )
        .set("Authorization", `Bearer ${userJwt}`)
        .send({
          data_pgto: new Date(),
          valor: "150.00",
        } as GastoFixoUpdateDto)
        .expect(200);

      // Act
      const response = await request(app.getHttpServer())
        .get(`${apiGlobalPrefix}/orcamentos/${testOrcamento.id}/gastos-fixos`)
        .query({ nome_categoria: "Teste Filtro" })
        .set("Authorization", `Bearer ${userJwt}`)
        .expect(200);

      // Assert
      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBe(1);
      expect(response.body[0].categoriaGasto.nome).toBe(
        "Categoria Teste Filtro",
      );
      expect(response.body[0].orcamento_id).toBe(testOrcamento.id);
    });

    it("should combine multiple filters", async () => {
      // Arrange
      const orcamentoMock: OrcamentoCreateDto = {
        nome: faker.string.alphanumeric(5),
        valor_inicial: faker.number
          .float({ min: 1000, max: 5000, fractionDigits: 2 })
          .toString(),
      };

      const orcamentoResponse = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/orcamentos`)
        .set("Authorization", `Bearer ${userJwt}`)
        .send(orcamentoMock)
        .expect(201);

      const testOrcamento = orcamentoResponse.body;

      // Criar gastos não pagos primeiro
      const gastoFixo1: GastoFixoCreateDto = {
        categoria_id: categoriaMock.id,
        descricao: "Internet Paga",
        previsto: "150.00",
      };

      const gastoFixo2: GastoFixoCreateDto = {
        categoria_id: categoriaMock.id,
        descricao: "Internet Não Paga",
        previsto: "150.00",
      };

      const gastoFixo3: GastoFixoCreateDto = {
        categoria_id: categoriaMock.id,
        descricao: "Água Paga",
        previsto: "80.00",
      };

      // Criar gasto 1 (Internet Paga)
      const gasto1 = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/orcamentos/${testOrcamento.id}/gastos-fixos`)
        .set("Authorization", `Bearer ${userJwt}`)
        .send(gastoFixo1)
        .expect(201);

      await request(app.getHttpServer())
        .patch(
          `${apiGlobalPrefix}/orcamentos/${testOrcamento.id}/gastos-fixos/${gasto1.body.id}`,
        )
        .set("Authorization", `Bearer ${userJwt}`)
        .send({
          data_pgto: new Date("2026-02-10"),
          valor: "150.75",
        } as GastoFixoUpdateDto)
        .expect(200);

      // Criar gasto 2 (Internet Não Paga)
      await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/orcamentos/${testOrcamento.id}/gastos-fixos`)
        .set("Authorization", `Bearer ${userJwt}`)
        .send(gastoFixo2)
        .expect(201);

      // Criar gasto 3 (Água Paga)
      const gasto3 = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/orcamentos/${testOrcamento.id}/gastos-fixos`)
        .set("Authorization", `Bearer ${userJwt}`)
        .send(gastoFixo3)
        .expect(201);

      await request(app.getHttpServer())
        .patch(
          `${apiGlobalPrefix}/orcamentos/${testOrcamento.id}/gastos-fixos/${gasto3.body.id}`,
        )
        .set("Authorization", `Bearer ${userJwt}`)
        .send({
          data_pgto: new Date("2026-02-15"),
          valor: "85.00",
        } as GastoFixoUpdateDto)
        .expect(200);

      // Act
      const response = await request(app.getHttpServer())
        .get(`${apiGlobalPrefix}/orcamentos/${testOrcamento.id}/gastos-fixos`)
        .query({
          descricao: "Internet",
          status: StatusGasto.PAGO,
        })
        .set("Authorization", `Bearer ${userJwt}`)
        .expect(200);

      // Assert
      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBe(1);
      expect(response.body[0].descricao).toBe("Internet Paga");
      expect(response.body[0].valor).toBe("150.75");
      expect(response.body[0].data_pgto).not.toBeNull();
      expect(response.body[0].orcamento_id).toBe(testOrcamento.id);
    });

    it("should return empty array when no gastos fixos match filters", async () => {
      // Arrange
      const orcamentoMock: OrcamentoCreateDto = {
        nome: faker.string.alphanumeric(5),
        valor_inicial: faker.number
          .float({ min: 1000, max: 5000, fractionDigits: 2 })
          .toString(),
      };

      const orcamentoResponse = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/orcamentos`)
        .set("Authorization", `Bearer ${userJwt}`)
        .send(orcamentoMock)
        .expect(201);

      const testOrcamento = orcamentoResponse.body;

      // Criar gasto não pago primeiro
      const gastoFixo: GastoFixoCreateDto = {
        categoria_id: categoriaMock.id,
        descricao: "Gasto Teste",
        previsto: "150.00",
      };

      const gasto = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/orcamentos/${testOrcamento.id}/gastos-fixos`)
        .set("Authorization", `Bearer ${userJwt}`)
        .send(gastoFixo)
        .expect(201);

      await request(app.getHttpServer())
        .patch(
          `${apiGlobalPrefix}/orcamentos/${testOrcamento.id}/gastos-fixos/${gasto.body.id}`,
        )
        .set("Authorization", `Bearer ${userJwt}`)
        .send({
          data_pgto: new Date(),
          valor: "150.00",
        } as GastoFixoUpdateDto)
        .expect(200);

      // Act
      const response = await request(app.getHttpServer())
        .get(`${apiGlobalPrefix}/orcamentos/${testOrcamento.id}/gastos-fixos`)
        .query({
          descricao: "NaoExiste",
          status: StatusGasto.NAO_PAGO,
        })
        .set("Authorization", `Bearer ${userJwt}`)
        .expect(200);

      // Assert
      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBe(0);
    });

    it("should return 400 when vencido filter has invalid value", async () => {
      // Arrange
      const orcamentoMock: OrcamentoCreateDto = {
        nome: faker.string.alphanumeric(5),
        valor_inicial: faker.number
          .float({ min: 1000, max: 5000, fractionDigits: 2 })
          .toString(),
      };

      const orcamentoResponse = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/orcamentos`)
        .set("Authorization", `Bearer ${userJwt}`)
        .send(orcamentoMock)
        .expect(201);

      const testOrcamento = orcamentoResponse.body;

      // Act
      const response = await request(app.getHttpServer())
        .get(`${apiGlobalPrefix}/orcamentos/${testOrcamento.id}/gastos-fixos`)
        .query({ vencido: "invalido" })
        .set("Authorization", `Bearer ${userJwt}`)
        .expect(400);

      // Assert
      expect(response.body.message).toEqual(["vencido deve ser true ou false"]);
    });
  });

  describe(`PATCH ${apiGlobalPrefix}/gastos-fixos/:id`, () => {
    it("should update an existing gasto fixo", async () => {
      const createGastoDto: GastoFixoCreateDto = {
        descricao: "Descrição antiga",
        previsto: faker.number
          .float({ min: 1, max: 50, fractionDigits: 2 })
          .toString(),
        categoria_id: categoriaMock.id,
      };

      const createResponse = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/orcamentos/${orcamentoMock.id}/gastos-fixos`)
        .set("Authorization", `Bearer ${userJwt}`)
        .send(createGastoDto)
        .expect(201);

      const gastoId = createResponse.body.id;

      const updateGastoDto: GastoFixoUpdateDto = {
        descricao: "Gasto Fixo D Atualizado",
        valor: "500.35",
        data_pgto: new Date(),
      };

      const response = await request(app.getHttpServer())
        .patch(
          `${apiGlobalPrefix}/orcamentos/${orcamentoMock.id}/gastos-fixos/${gastoId}`,
        )
        .set("Authorization", `Bearer ${userJwt}`)
        .send(updateGastoDto)
        .expect(200);

      expect(response.body.descricao).toBe(updateGastoDto.descricao);
      expect(response.body.valor).toBe(updateGastoDto.valor);
    });

    it("should return 400 with correct messages when update a gasto fixo when all fields as null", async () => {
      const createGastoDto: GastoFixoCreateDto = {
        descricao: "Descrição antiga",
        previsto: faker.number
          .float({ min: 1, max: 50, fractionDigits: 2 })
          .toString(),
        categoria_id: categoriaMock.id,
      };

      const createResponse = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/orcamentos/${orcamentoMock.id}/gastos-fixos`)
        .set("Authorization", `Bearer ${userJwt}`)
        .send(createGastoDto)
        .expect(201);

      const gastoId = createResponse.body.id;

      const updateGastoDto: Required<GastoFixoUpdateDto> = {
        descricao: null,
        previsto: null,
        valor: null,
        categoria_id: null,
        data_pgto: null,
        data_inatividade: null,
        data_venc: null,
        observacoes: null,
      };

      const response = await request(app.getHttpServer())
        .patch(
          `${apiGlobalPrefix}/orcamentos/${orcamentoMock.id}/gastos-fixos/${gastoId}`,
        )
        .set("Authorization", `Bearer ${userJwt}`)
        .send(updateGastoDto)
        .expect(400);

      expect(response.body).toHaveProperty("message");
      expect(Array.isArray(response.body.message)).toBe(true);

      expect(response.body.message).toEqual([
        "descricao should not be empty",
        "descricao must be a string",
        "previsto should not be empty",
        "previsto is not a valid decimal number.",
        "categoria_id should not be empty",
        "categoria_id must be an integer number",
      ]);
    });

    it("should return 400 with correct messages when update a gasto fixo when all fields as wrong", async () => {
      const createGastoDto: GastoFixoCreateDto = {
        descricao: "Descrição antiga",
        previsto: faker.number
          .float({ min: 1, max: 50, fractionDigits: 2 })
          .toString(),
        categoria_id: categoriaMock.id,
      };

      const createResponse = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/orcamentos/${orcamentoMock.id}/gastos-fixos`)
        .set("Authorization", `Bearer ${userJwt}`)
        .send(createGastoDto)
        .expect(201);

      const gastoId = createResponse.body.id;

      const updateGastoDto: Required<GastoFixoUpdateDto> = {
        descricao: faker.number.int({
          min: 100,
          max: 999,
        }) as unknown as string,
        previsto: faker.string.alpha(5),
        valor: faker.string.alpha(5),
        categoria_id: faker.string.alpha(5) as unknown as number,
        data_pgto: faker.number.int({ min: 100, max: 999 }) as unknown as Date,
        data_inatividade: faker.number.int({
          min: 100,
          max: 999,
        }) as unknown as Date,
        data_venc: faker.number.int({
          min: 100,
          max: 999,
        }) as unknown as Date,
        observacoes: faker.number.int({
          min: 100,
          max: 999,
        }) as unknown as string,
      };

      const response = await request(app.getHttpServer())
        .patch(
          `${apiGlobalPrefix}/orcamentos/${orcamentoMock.id}/gastos-fixos/${gastoId}`,
        )
        .set("Authorization", `Bearer ${userJwt}`)
        .send(updateGastoDto)
        .expect(400);

      expect(response.body).toHaveProperty("message");
      expect(Array.isArray(response.body.message)).toBe(true);

      expect(response.body.message).toEqual([
        "descricao must be a string",
        "previsto is not a valid decimal number.",
        "valor is not a valid decimal number.",
        "categoria_id must be an integer number",
        "observacoes must be a string",
      ]);
    });

    it("should return 200 when update observacoes", async () => {
      const createGastoDto: GastoFixoCreateDto = {
        descricao: "Descrição antiga",
        previsto: faker.number
          .float({ min: 1, max: 50, fractionDigits: 2 })
          .toString(),
        categoria_id: categoriaMock.id,
      };

      const createResponse = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/orcamentos/${orcamentoMock.id}/gastos-fixos`)
        .set("Authorization", `Bearer ${userJwt}`)
        .send(createGastoDto)
        .expect(201);

      const gastoId = createResponse.body.id;

      const updateGastoDto: GastoFixoUpdateDto = {
        observacoes: faker.string.alphanumeric(5),
      };

      const response = await request(app.getHttpServer())
        .patch(
          `${apiGlobalPrefix}/orcamentos/${orcamentoMock.id}/gastos-fixos/${gastoId}`,
        )
        .set("Authorization", `Bearer ${userJwt}`)
        .send(updateGastoDto)
        .expect(200);

      expect(response.body.observacoes).toBe(updateGastoDto.observacoes);
    });

    it("should return 200 when setting observacoes to null", async () => {
      const createGastoDto: GastoFixoCreateDto = {
        descricao: "Descrição antiga",
        previsto: faker.number
          .float({ min: 1, max: 50, fractionDigits: 2 })
          .toString(),
        categoria_id: categoriaMock.id,
      };

      const createResponse = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/orcamentos/${orcamentoMock.id}/gastos-fixos`)
        .set("Authorization", `Bearer ${userJwt}`)
        .send(createGastoDto)
        .expect(201);

      const gastoId = createResponse.body.id;

      const updateGastoDto: GastoFixoUpdateDto = {
        observacoes: null,
      };

      const response = await request(app.getHttpServer())
        .patch(
          `${apiGlobalPrefix}/orcamentos/${orcamentoMock.id}/gastos-fixos/${gastoId}`,
        )
        .set("Authorization", `Bearer ${userJwt}`)
        .send(updateGastoDto)
        .expect(200);

      expect(response.body.observacoes).toBeNull();
    });

    it("should return a 404 error if the gasto fixo exists but does not belong to the specified orcamento", async () => {
      const orcamentoMock2: OrcamentoCreateDto = {
        nome: faker.string.alphanumeric(5),
        valor_inicial: faker.number
          .float({ min: 100, max: 999, fractionDigits: 2 })
          .toString(),
      };

      const orcamento2 = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/orcamentos`)
        .set("Authorization", `Bearer ${userJwt}`)
        .send(orcamentoMock2)
        .expect(201);

      const createGastoDto: GastoFixoCreateDto = {
        descricao: "Descrição antiga",
        previsto: faker.number
          .float({ min: 1, max: 50, fractionDigits: 2 })
          .toString(),
        categoria_id: categoriaMock.id,
      };

      const createResponse = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/orcamentos/${orcamentoMock.id}/gastos-fixos`)
        .set("Authorization", `Bearer ${userJwt}`)
        .send(createGastoDto)
        .expect(201);

      const gastoId = createResponse.body.id;

      const updateGastoDto: GastoFixoUpdateDto = {
        descricao: "Gasto Fixo D Atualizado",
        valor: "500.35",
        data_pgto: new Date(),
      };

      await request(app.getHttpServer())
        .patch(
          `${apiGlobalPrefix}/orcamentos/${orcamento2.body.id}/gastos-fixos/${gastoId}`,
        )
        .set("Authorization", `Bearer ${userJwt}`)
        .send(updateGastoDto)
        .expect(404);
    });

    it("should return 409 if add valor without data_pgto", async () => {
      const createGastoDto: GastoFixoCreateDto = {
        descricao: "Descrição antiga",
        previsto: faker.number
          .float({ min: 1, max: 50, fractionDigits: 2 })
          .toString(),
        categoria_id: categoriaMock.id,
      };

      const createResponse = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/orcamentos/${orcamentoMock.id}/gastos-fixos`)
        .set("Authorization", `Bearer ${userJwt}`)
        .send(createGastoDto)
        .expect(201);

      const gastoId = createResponse.body.id;

      const updateGastoDto: GastoFixoUpdateDto = {
        descricao: "Gasto Fixo D Atualizado",
        valor: "500.35",
      };

      const response = await request(app.getHttpServer())
        .patch(
          `${apiGlobalPrefix}/orcamentos/${orcamentoMock.id}/gastos-fixos/${gastoId}`,
        )
        .set("Authorization", `Bearer ${userJwt}`)
        .send(updateGastoDto)
        .expect(409);

      expect(response.body.message).toBe(
        "Se o valor for preenchido, a data_pgto também deve ser preenchida.",
      );
    });

    it("should return 409 if add valor with a null data_pgto", async () => {
      const createGastoDto: GastoFixoCreateDto = {
        descricao: "Descrição antiga",
        previsto: faker.number
          .float({ min: 1, max: 50, fractionDigits: 2 })
          .toString(),
        categoria_id: categoriaMock.id,
      };

      const createResponse = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/orcamentos/${orcamentoMock.id}/gastos-fixos`)
        .set("Authorization", `Bearer ${userJwt}`)
        .send(createGastoDto)
        .expect(201);

      const gastoId = createResponse.body.id;

      const updateGastoDto: GastoFixoUpdateDto = {
        descricao: "Gasto Fixo D Atualizado",
        valor: "500.35",
        data_pgto: null,
      };

      const response = await request(app.getHttpServer())
        .patch(
          `${apiGlobalPrefix}/orcamentos/${orcamentoMock.id}/gastos-fixos/${gastoId}`,
        )
        .set("Authorization", `Bearer ${userJwt}`)
        .send(updateGastoDto)
        .expect(409);

      expect(response.body.message).toBe(
        "Se o valor for preenchido, a data_pgto também deve ser preenchida.",
      );
    });

    it("should return 404 if gasto fixo not found for update", async () => {
      const updateGastoDto: GastoFixoUpdateDto = {
        descricao: "Gasto Fixo E Atualizado",
        valor: "600.00",
      };

      await request(app.getHttpServer())
        .patch(
          `${apiGlobalPrefix}/orcamentos/${orcamentoMock.id}/gastos-fixos/9999`,
        )
        .set("Authorization", `Bearer ${userJwt}`)
        .send(updateGastoDto)
        .expect(404);
    });

    it("should return 404 if gasto fixo was soft deleted", async () => {
      const createGastoDto: GastoFixoCreateDto = {
        descricao: "Descrição antiga",
        previsto: faker.number
          .float({ min: 1, max: 50, fractionDigits: 2 })
          .toString(),
        categoria_id: categoriaMock.id,
      };

      const createResponse = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/orcamentos/${orcamentoMock.id}/gastos-fixos`)
        .set("Authorization", `Bearer ${userJwt}`)
        .send(createGastoDto)
        .expect(201);

      const gastoId = createResponse.body.id;

      await request(app.getHttpServer())
        .delete(
          `${apiGlobalPrefix}/orcamentos/${orcamentoMock.id}/gastos-fixos/${createResponse.body.id}`,
        )
        .set("Authorization", `Bearer ${userJwt}`)
        .expect(200);

      const updateGastoDto: GastoFixoUpdateDto = {
        descricao: "Gasto Fixo D Atualizado",
        valor: "500.35",
        data_pgto: new Date(),
      };

      await request(app.getHttpServer())
        .patch(
          `${apiGlobalPrefix}/orcamentos/${orcamentoMock.id}/gastos-fixos/${gastoId}`,
        )
        .set("Authorization", `Bearer ${userJwt}`)
        .send(updateGastoDto)
        .expect(404);
    });

    it("should return 404 if orcamento was soft deleted", async () => {
      const orcamentoMock: OrcamentoCreateDto = {
        nome: faker.string.alphanumeric(5),
        valor_inicial: faker.number
          .float({ min: 100, max: 999, fractionDigits: 2 })
          .toString(),
      };

      const orcamentoResponse = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/orcamentos`)
        .set("Authorization", `Bearer ${userJwt}`)
        .send(orcamentoMock)
        .expect(201);

      const createGastoDto: GastoFixoCreateDto = {
        descricao: "Descrição antiga",
        previsto: faker.number
          .float({ min: 1, max: 50, fractionDigits: 2 })
          .toString(),
        categoria_id: categoriaMock.id,
      };

      const createResponse = await request(app.getHttpServer())
        .post(
          `${apiGlobalPrefix}/orcamentos/${orcamentoResponse.body.id}/gastos-fixos`,
        )
        .set("Authorization", `Bearer ${userJwt}`)
        .send(createGastoDto)
        .expect(201);

      const gastoId = createResponse.body.id;

      await request(app.getHttpServer())
        .delete(`${apiGlobalPrefix}/orcamentos/${orcamentoResponse.body.id}`)
        .set("Authorization", `Bearer ${userJwt}`)
        .expect(200);

      const updateGastoDto: GastoFixoUpdateDto = {
        descricao: "Gasto Fixo D Atualizado",
        valor: "500.35",
        data_pgto: new Date(),
      };

      const response = await request(app.getHttpServer())
        .patch(
          `${apiGlobalPrefix}/orcamentos/${orcamentoResponse.body.id}/gastos-fixos/${gastoId}`,
        )
        .set("Authorization", `Bearer ${userJwt}`)
        .send(updateGastoDto)
        .expect(404);

      expect(response.body.message).toBe(
        "O orçamento informado não foi encontrado.",
      );
    });
  });

  describe(`DELETE ${apiGlobalPrefix}/gastos-fixos/:id`, () => {
    it("should soft delete a gasto fixo", async () => {
      const createGastoDto: GastoFixoCreateDto = {
        descricao: faker.string.alphanumeric(5),
        previsto: faker.number
          .float({ min: 1, max: 50, fractionDigits: 2 })
          .toString(),
        categoria_id: categoriaMock.id,
      };

      const createResponse = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/orcamentos/${orcamentoMock.id}/gastos-fixos`)
        .set("Authorization", `Bearer ${userJwt}`)
        .send(createGastoDto)
        .expect(201);

      const gastoId = createResponse.body.id;

      const response = await request(app.getHttpServer())
        .delete(
          `${apiGlobalPrefix}/orcamentos/${orcamentoMock.id}/gastos-fixos/${gastoId}`,
        )
        .set("Authorization", `Bearer ${userJwt}`)
        .expect(200);

      expect(response.body.soft_delete).toBeTruthy();
    });

    it("should return 404 if gasto fixo not found for delete", async () => {
      await request(app.getHttpServer())
        .delete(
          `${apiGlobalPrefix}/orcamentos/${orcamentoMock.id}/gastos-fixos/9999`,
        )
        .set("Authorization", `Bearer ${userJwt}`)
        .expect(404);
    });

    it("should return a 404 error if the gasto fixo exists but does not belong to the specified orcamento", async () => {
      const orcamentoMock2: OrcamentoCreateDto = {
        nome: faker.string.alphanumeric(5),
        valor_inicial: faker.number
          .float({ min: 100, max: 999, fractionDigits: 2 })
          .toString(),
      };

      const orcamento2 = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/orcamentos`)
        .set("Authorization", `Bearer ${userJwt}`)
        .send(orcamentoMock2)
        .expect(201);

      const createGastoDto: GastoFixoCreateDto = {
        descricao: faker.string.alphanumeric(5),
        previsto: faker.number
          .float({ min: 1, max: 50, fractionDigits: 2 })
          .toString(),
        categoria_id: categoriaMock.id,
      };

      const createResponse = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/orcamentos/${orcamentoMock.id}/gastos-fixos`)
        .set("Authorization", `Bearer ${userJwt}`)
        .send(createGastoDto)
        .expect(201);

      const gastoId = createResponse.body.id;

      await request(app.getHttpServer())
        .delete(
          `${apiGlobalPrefix}/orcamentos/${orcamento2.body.id}/gastos-fixos/${gastoId}`,
        )
        .set("Authorization", `Bearer ${userJwt}`)
        .expect(404);
    });

    it("should return a 404 error if the gasto fixo was soft deleted", async () => {
      const orcamentoMock: OrcamentoCreateDto = {
        nome: faker.string.alphanumeric(5),
        valor_inicial: faker.number
          .float({ min: 100, max: 999, fractionDigits: 2 })
          .toString(),
      };

      const orcamentoResponse = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/orcamentos`)
        .set("Authorization", `Bearer ${userJwt}`)
        .send(orcamentoMock)
        .expect(201);

      const createGastoDto: GastoFixoCreateDto = {
        descricao: faker.string.alphanumeric(5),
        previsto: faker.number
          .float({ min: 1, max: 50, fractionDigits: 2 })
          .toString(),
        categoria_id: categoriaMock.id,
      };

      const createResponse = await request(app.getHttpServer())
        .post(
          `${apiGlobalPrefix}/orcamentos/${orcamentoResponse.body.id}/gastos-fixos`,
        )
        .set("Authorization", `Bearer ${userJwt}`)
        .send(createGastoDto)
        .expect(201);

      const gastoId = createResponse.body.id;

      await request(app.getHttpServer())
        .delete(
          `${apiGlobalPrefix}/orcamentos/${orcamentoResponse.body.id}/gastos-fixos/${gastoId}`,
        )
        .set("Authorization", `Bearer ${userJwt}`)
        .expect(200);

      await request(app.getHttpServer())
        .delete(
          `${apiGlobalPrefix}/orcamentos/${orcamentoResponse.body.id}/gastos-fixos/${gastoId}`,
        )
        .set("Authorization", `Bearer ${userJwt}`)
        .expect(404);
    });

    it("should return a 404 error if orcamento was soft deleted", async () => {
      const orcamentoMock: OrcamentoCreateDto = {
        nome: faker.string.alphanumeric(5),
        valor_inicial: faker.number
          .float({ min: 100, max: 999, fractionDigits: 2 })
          .toString(),
      };

      const orcamentoResponse = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/orcamentos`)
        .set("Authorization", `Bearer ${userJwt}`)
        .send(orcamentoMock)
        .expect(201);

      const createGastoDto: GastoFixoCreateDto = {
        descricao: faker.string.alphanumeric(5),
        previsto: faker.number
          .float({ min: 1, max: 50, fractionDigits: 2 })
          .toString(),
        categoria_id: categoriaMock.id,
      };

      const createResponse = await request(app.getHttpServer())
        .post(
          `${apiGlobalPrefix}/orcamentos/${orcamentoResponse.body.id}/gastos-fixos`,
        )
        .set("Authorization", `Bearer ${userJwt}`)
        .send(createGastoDto)
        .expect(201);

      const gastoId = createResponse.body.id;

      await request(app.getHttpServer())
        .delete(`${apiGlobalPrefix}/orcamentos/${orcamentoResponse.body.id}`)
        .set("Authorization", `Bearer ${userJwt}`)
        .expect(200);

      const response = await request(app.getHttpServer())
        .delete(
          `${apiGlobalPrefix}/orcamentos/${orcamentoResponse.body.id}/gastos-fixos/${gastoId}`,
        )
        .set("Authorization", `Bearer ${userJwt}`)
        .expect(404);

      expect(response.body.message).toBe(
        "O orçamento informado não foi encontrado.",
      );
    });
  });
});

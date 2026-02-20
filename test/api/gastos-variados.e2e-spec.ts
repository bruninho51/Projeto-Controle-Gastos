import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { PrismaService } from "../../src/modules/prisma/prisma.service";
import { globalPipes } from "../../src/pipes/globalPipes";
import { globalFilters } from "../../src/filters/global-filters";
import { globalInterceptors } from "../../src/interceptors/globalInterceptors";
import { runPrismaMigrations } from "../utils/run-prisma-migrations";
import { faker } from "@faker-js/faker";
import { CategoriaGasto, Orcamento, Usuario } from "@prisma/client";
import { OrcamentoCreateDto } from "../../src/modules/api/orcamentos/dtos/OrcamentoCreate.dto";
import { OrcamentosModule } from "../../src/modules/api/orcamentos/orcamentos.module";
import { GastosVariadosModule } from "../../src/modules/api/gastos-variados/gastos-variados.module";
import { GastoVariadoCreateDto } from "../../src/modules/api/gastos-variados/dtos/GastoVariadoCreate.dto";
import { GastoVariadoUpdateDto } from "../../src/modules/api/gastos-variados/dtos/GastoVariadoUpdate.dto";
import { CategoriaGastoCreateDto } from "../../src/modules/api/categorias-gastos/dtos/CategoriaGastoCreate.dto";
import { formatValue } from "../utils/format-value";
import { CategoriasGastosModule } from "../../src/modules/api/categorias-gastos/categorias-gastos.module";
import { AuthService } from "../../src/modules/api/auth/auth.service";
import { AuthModule } from "../../src/modules/api/auth/auth.module";

jest.setTimeout(10000); // 10 segundos

const apiGlobalPrefix = "/api/v1";

describe("GastosVariadosController (v1) (E2E)", () => {
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
        GastosVariadosModule,
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

  describe(`POST ${apiGlobalPrefix}/gastos-variados`, () => {
    it("should create a new gasto variado", async () => {
      const mockDataPgto = new Date();
      mockDataPgto.setUTCHours(0, 0, 0, 0);

      const createGastoDto: GastoVariadoCreateDto = {
        descricao: faker.string.alphanumeric(5),
        valor: faker.number
          .float({ min: 1, max: 50, fractionDigits: 2 })
          .toString(),
        data_pgto: mockDataPgto,
        categoria_id: categoriaMock.id,
      };

      const response = await request(app.getHttpServer())
        .post(
          `${apiGlobalPrefix}/orcamentos/${orcamentoMock.id}/gastos-variados`,
        )
        .set("Authorization", `Bearer ${userJwt}`)
        .send(createGastoDto)
        .expect(201);

      expect(response.body).toHaveProperty("id");
      expect(response.body.descricao).toBe(createGastoDto.descricao);
      expect(response.body.valor).toBe(createGastoDto.valor);
      expect(response.body.data_pgto).toBe(mockDataPgto.toISOString());
      expect(response.body.categoria_id).toBe(createGastoDto.categoria_id);
      expect(response.body.orcamento_id).toBe(orcamentoMock.id);
    });

    it("should return 400 with correct messages when create a new gasto variado when all fields as null", async () => {
      const mockDataPgto = new Date();
      mockDataPgto.setUTCHours(0, 0, 0, 0);

      const createGastoDto: Required<GastoVariadoCreateDto> = {
        descricao: null,
        valor: null,
        data_pgto: null,
        categoria_id: null,
        observacoes: null,
      };

      const response = await request(app.getHttpServer())
        .post(
          `${apiGlobalPrefix}/orcamentos/${orcamentoMock.id}/gastos-variados`,
        )
        .set("Authorization", `Bearer ${userJwt}`)
        .send(createGastoDto)
        .expect(400);

      expect(response.body).toHaveProperty("message");
      expect(Array.isArray(response.body.message)).toBe(true);

      expect(response.body.message).toEqual([
        "descricao should not be empty",
        "descricao must be a string",
        "valor should not be empty",
        "valor is not a valid decimal number.",
        "data_pgto should not be empty",
        "data_pgto must be a Date instance",
        "categoria_id should not be empty",
        "categoria_id must be an integer number",
      ]);
    });

    it("should return 400 with correct messages when create a new gasto variado when all fields as wrong", async () => {
      const mockDataPgto = new Date();
      mockDataPgto.setUTCHours(0, 0, 0, 0);

      const createGastoDto: Required<GastoVariadoCreateDto> = {
        descricao: faker.number.int({
          min: 100,
          max: 999,
        }) as unknown as string,
        valor: faker.string.alpha(5),
        data_pgto: faker.string.alpha(5) as unknown as Date,
        categoria_id: faker.string.alpha(5) as unknown as number,
        observacoes: faker.number.int({
          min: 100,
          max: 999,
        }) as unknown as string,
      };

      const response = await request(app.getHttpServer())
        .post(
          `${apiGlobalPrefix}/orcamentos/${orcamentoMock.id}/gastos-variados`,
        )
        .set("Authorization", `Bearer ${userJwt}`)
        .send(createGastoDto)
        .expect(400);

      expect(response.body).toHaveProperty("message");
      expect(Array.isArray(response.body.message)).toBe(true);

      expect(response.body.message).toEqual([
        "descricao must be a string",
        "valor is not a valid decimal number.",
        "data_pgto must be a Date instance",
        "categoria_id must be an integer number",
        "observacoes must be a string",
      ]);
    });

    it("should return 400 if data_pgto is passed as null", async () => {
      const createGastoDto: GastoVariadoCreateDto = {
        descricao: faker.string.alphanumeric(5),
        valor: faker.number
          .float({ min: 1, max: 50, fractionDigits: 2 })
          .toString(),
        data_pgto: null,
        categoria_id: categoriaMock.id,
      };

      const response = await request(app.getHttpServer())
        .post(
          `${apiGlobalPrefix}/orcamentos/${orcamentoMock.id}/gastos-variados`,
        )
        .set("Authorization", `Bearer ${userJwt}`)
        .send(createGastoDto)
        .expect(400);

      expect(response.body.message).toEqual([
        "data_pgto should not be empty",
        "data_pgto must be a Date instance",
      ]);
    });

    it("should return 404 when categoria gasto does not exists", async () => {
      const mockDataPgto = new Date();
      mockDataPgto.setUTCHours(0, 0, 0, 0);

      const createGastoDto: GastoVariadoCreateDto = {
        descricao: faker.string.alphanumeric(5),
        valor: faker.number
          .float({ min: 1, max: 50, fractionDigits: 2 })
          .toString(),
        data_pgto: mockDataPgto,
        categoria_id: 999,
      };

      const response = await request(app.getHttpServer())
        .post(
          `${apiGlobalPrefix}/orcamentos/${orcamentoMock.id}/gastos-variados`,
        )
        .set("Authorization", `Bearer ${userJwt}`)
        .send(createGastoDto)
        .expect(404);

      expect(response.body.message).toBe(
        "A categoria informada não foi encontrada.",
      );
    });

    it("should return 404 when categoria gasto was soft deleted", async () => {
      const mockDataPgto = new Date();
      mockDataPgto.setUTCHours(0, 0, 0, 0);

      const newCategoria: CategoriaGastoCreateDto = {
        nome: faker.string.alphanumeric(6).toUpperCase(),
      };

      const responseCategoria = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/categorias-gastos`)
        .set("Authorization", `Bearer ${userJwt}`)
        .send(newCategoria)
        .expect(201);

      await request(app.getHttpServer())
        .delete(
          `${apiGlobalPrefix}/categorias-gastos/${responseCategoria.body.id}`,
        )
        .set("Authorization", `Bearer ${userJwt}`)
        .expect(200);

      const createGastoDto: GastoVariadoCreateDto = {
        descricao: faker.string.alphanumeric(5),
        valor: faker.number
          .float({ min: 1, max: 50, fractionDigits: 2 })
          .toString(),
        data_pgto: mockDataPgto,
        categoria_id: responseCategoria.body.id,
      };

      const response = await request(app.getHttpServer())
        .post(
          `${apiGlobalPrefix}/orcamentos/${orcamentoMock.id}/gastos-variados`,
        )
        .set("Authorization", `Bearer ${userJwt}`)
        .send(createGastoDto)
        .expect(404);

      expect(response.body.message).toBe(
        "A categoria informada não foi encontrada.",
      );
    });

    it("should return 404 when orcamento was soft deleted", async () => {
      const mockDataPgto = new Date();
      mockDataPgto.setUTCHours(0, 0, 0, 0);

      const createOrcamentoDto = {
        nome: faker.string.alphanumeric(5),
        valor_inicial: formatValue(
          faker.number.float({ min: 1, max: 50, fractionDigits: 2 }),
        ),
      };

      const responseOrcamento = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/orcamentos`)
        .set("Authorization", `Bearer ${userJwt}`)
        .send(createOrcamentoDto)
        .expect(201);

      await request(app.getHttpServer())
        .delete(`${apiGlobalPrefix}/orcamentos/${responseOrcamento.body.id}`)
        .set("Authorization", `Bearer ${userJwt}`)
        .expect(200);

      const createGastoDto: GastoVariadoCreateDto = {
        descricao: faker.string.alphanumeric(5),
        valor: faker.number
          .float({ min: 1, max: 50, fractionDigits: 2 })
          .toString(),
        data_pgto: mockDataPgto,
        categoria_id: categoriaMock.id,
      };

      const response = await request(app.getHttpServer())
        .post(
          `${apiGlobalPrefix}/orcamentos/${responseOrcamento.body.id}/gastos-variados`,
        )
        .set("Authorization", `Bearer ${userJwt}`)
        .send(createGastoDto)
        .expect(404);

      expect(response.body.message).toBe(
        "O orçamento informado não foi encontrado.",
      );
    });

    it("should return 404 when orcamento does not exists", async () => {
      const mockDataPgto = new Date();
      mockDataPgto.setUTCHours(0, 0, 0, 0);

      const createGastoDto: GastoVariadoCreateDto = {
        descricao: faker.string.alphanumeric(5),
        valor: faker.number
          .float({ min: 1, max: 50, fractionDigits: 2 })
          .toString(),
        data_pgto: mockDataPgto,
        categoria_id: categoriaMock.id,
      };

      const response = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/orcamentos/999/gastos-variados`)
        .set("Authorization", `Bearer ${userJwt}`)
        .send(createGastoDto)
        .expect(404);

      expect(response.body.message).toBe(
        "O orçamento informado não foi encontrado.",
      );
    });

    it("should return 400 on passing an invalid field on create a new gasto variado", async () => {
      const mockDataPgto = new Date();
      mockDataPgto.setUTCHours(0, 0, 0, 0);

      const createGastoDto = {
        descricao: faker.string.alphanumeric(5),
        valor: faker.number
          .float({ min: 1, max: 50, fractionDigits: 2 })
          .toString(),
        data_pgto: mockDataPgto,
        categoria_id: categoriaMock.id,
        invalid_field: "invalid",
      } as GastoVariadoCreateDto;

      await request(app.getHttpServer())
        .post(
          `${apiGlobalPrefix}/orcamentos/${orcamentoMock.id}/gastos-variados`,
        )
        .set("Authorization", `Bearer ${userJwt}`)
        .send(createGastoDto)
        .expect(400);
    });
  });

  describe(`GET ${apiGlobalPrefix}/gastos-variados`, () => {
    it("should return all gastos variados", async () => {
      const mockDataPgto = new Date();
      mockDataPgto.setUTCHours(0, 0, 0, 0);

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

      const gastoVariadoOrcamento2: GastoVariadoCreateDto = {
        categoria_id: categoriaMock.id,
        descricao: faker.string.alphanumeric(5),
        valor: faker.number
          .float({ min: 100, max: 999, fractionDigits: 2 })
          .toString(),
        data_pgto: mockDataPgto,
        observacoes: faker.string.alphanumeric(5),
      };

      await request(app.getHttpServer())
        .post(
          `${apiGlobalPrefix}/orcamentos/${orcamento2.body.id}/gastos-variados`,
        )
        .set("Authorization", `Bearer ${userJwt}`)
        .send(gastoVariadoOrcamento2)
        .expect(201);

      const responseOrcamentoMock = await request(app.getHttpServer())
        .get(
          `${apiGlobalPrefix}/orcamentos/${orcamentoMock.id}/gastos-variados`,
        )
        .set("Authorization", `Bearer ${userJwt}`)
        .expect(200);

      const responseOrcamentoMock2 = await request(app.getHttpServer())
        .get(
          `${apiGlobalPrefix}/orcamentos/${orcamento2.body.id}/gastos-variados`,
        )
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

    it("should not return soft deleted gasto variado", async () => {
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

      const gastoVariadoOrcamento: GastoVariadoCreateDto = {
        categoria_id: categoriaMock.id,
        descricao: faker.string.alphanumeric(5),
        valor: faker.number
          .float({ min: 100, max: 999, fractionDigits: 2 })
          .toString(),
        data_pgto: new Date(),
        observacoes: faker.string.alphanumeric(5),
      };

      const gastoVariadoResponse = await request(app.getHttpServer())
        .post(
          `${apiGlobalPrefix}/orcamentos/${orcamentoResponse.body.id}/gastos-variados`,
        )
        .set("Authorization", `Bearer ${userJwt}`)
        .send(gastoVariadoOrcamento)
        .expect(201);

      await request(app.getHttpServer())
        .delete(
          `${apiGlobalPrefix}/orcamentos/${orcamentoResponse.body.id}/gastos-variados/${gastoVariadoResponse.body.id}`,
        )
        .set("Authorization", `Bearer ${userJwt}`)
        .expect(200);

      const response = await request(app.getHttpServer())
        .get(
          `${apiGlobalPrefix}/orcamentos/${orcamentoResponse.body.id}/gastos-variados`,
        )
        .set("Authorization", `Bearer ${userJwt}`)
        .expect(200);

      expect(response.body.length).toBe(0);
    });

    it("should return 404 if orcamento was soft deleted", async () => {
      const createOrcamentoDto = {
        nome: faker.string.alphanumeric(5),
        valor_inicial: formatValue(
          faker.number.float({ min: 1, max: 50, fractionDigits: 2 }),
        ),
      };

      const responseOrcamento = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/orcamentos`)
        .set("Authorization", `Bearer ${userJwt}`)
        .send(createOrcamentoDto)
        .expect(201);

      await request(app.getHttpServer())
        .delete(`${apiGlobalPrefix}/orcamentos/${responseOrcamento.body.id}`)
        .set("Authorization", `Bearer ${userJwt}`)
        .expect(200);

      const response = await request(app.getHttpServer())
        .get(
          `${apiGlobalPrefix}/orcamentos/${responseOrcamento.body.id}/gastos-variados`,
        )
        .set("Authorization", `Bearer ${userJwt}`)
        .expect(404);

      expect(response.body.message).toBe(
        "O orçamento informado não foi encontrado.",
      );
    });
  });

  describe(`GET ${apiGlobalPrefix}/gastos-variados/:id`, () => {
    it("should return a single gasto variado", async () => {
      const mockDataPgto = new Date();
      mockDataPgto.setUTCHours(0, 0, 0, 0);

      const createGastoDto: GastoVariadoCreateDto = {
        descricao: faker.string.alphanumeric(5),
        valor: faker.number
          .float({ min: 1, max: 50, fractionDigits: 2 })
          .toString(),
        data_pgto: mockDataPgto,
        categoria_id: categoriaMock.id,
      };

      const createResponse = await request(app.getHttpServer())
        .post(
          `${apiGlobalPrefix}/orcamentos/${orcamentoMock.id}/gastos-variados`,
        )
        .set("Authorization", `Bearer ${userJwt}`)
        .send(createGastoDto)
        .expect(201);

      const gastoId = createResponse.body.id;

      const response = await request(app.getHttpServer())
        .get(
          `${apiGlobalPrefix}/orcamentos/${orcamentoMock.id}/gastos-variados/${gastoId}`,
        )
        .set("Authorization", `Bearer ${userJwt}`)
        .expect(200);

      expect(response.body.id).toBe(gastoId);
      expect(response.body.descricao).toBe(createGastoDto.descricao);
      expect(response.body.valor).toBe(createGastoDto.valor);
      expect(response.body.data_pgto).toBe(mockDataPgto.toISOString());
      expect(response.body.categoria_id).toBe(createGastoDto.categoria_id);
      expect(response.body.orcamento_id).toBe(orcamentoMock.id);
    });

    it("should return a 404 error if the gasto variado exists but does not belong to the specified orcamento", async () => {
      const mockDataPgto = new Date();
      mockDataPgto.setUTCHours(0, 0, 0, 0);

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

      const createGastoDto: GastoVariadoCreateDto = {
        descricao: faker.string.alphanumeric(5),
        valor: faker.number
          .float({ min: 1, max: 50, fractionDigits: 2 })
          .toString(),
        data_pgto: mockDataPgto,
        categoria_id: categoriaMock.id,
      };

      const createResponse = await request(app.getHttpServer())
        .post(
          `${apiGlobalPrefix}/orcamentos/${orcamentoMock.id}/gastos-variados`,
        )
        .set("Authorization", `Bearer ${userJwt}`)
        .send(createGastoDto)
        .expect(201);

      const gastoId = createResponse.body.id;

      await request(app.getHttpServer())
        .get(
          `${apiGlobalPrefix}/orcamentos/${orcamento2.body.id}/gastos-variados/${gastoId}`,
        )
        .set("Authorization", `Bearer ${userJwt}`)
        .expect(404);
    });

    it("should return 404 if gasto variado not found", async () => {
      const response = await request(app.getHttpServer())
        .get(
          `${apiGlobalPrefix}/orcamentos/${orcamentoMock.id}/gastos-variados/9999`,
        )
        .set("Authorization", `Bearer ${userJwt}`)
        .expect(404);

      expect(response.body.message).toBe("Not Found");
    });

    it("should return 404 if gasto variado was soft deleted", async () => {
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

      const createGastoDto: GastoVariadoCreateDto = {
        descricao: faker.string.alphanumeric(5),
        valor: formatValue(
          faker.number.float({ min: 1, max: 50, fractionDigits: 2 }),
        ),
        data_pgto: new Date(),
        categoria_id: categoriaMock.id,
      };

      const createResponse = await request(app.getHttpServer())
        .post(
          `${apiGlobalPrefix}/orcamentos/${orcamentoResponse.body.id}/gastos-variados`,
        )
        .set("Authorization", `Bearer ${userJwt}`)
        .send(createGastoDto)
        .expect(201);

      const gastoId = createResponse.body.id;

      await request(app.getHttpServer())
        .delete(
          `${apiGlobalPrefix}/orcamentos/${orcamentoResponse.body.id}/gastos-variados/${gastoId}`,
        )
        .set("Authorization", `Bearer ${userJwt}`)
        .expect(200);

      const response = await request(app.getHttpServer())
        .get(
          `${apiGlobalPrefix}/orcamentos/${orcamentoResponse.body.id}/gastos-variados/${gastoId}`,
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

      const createGastoDto: GastoVariadoCreateDto = {
        descricao: faker.string.alphanumeric(5),
        valor: faker.number
          .float({ min: 1, max: 50, fractionDigits: 2 })
          .toString(),
        data_pgto: new Date(),
        categoria_id: categoriaMock.id,
      };

      const createResponse = await request(app.getHttpServer())
        .post(
          `${apiGlobalPrefix}/orcamentos/${orcamentoResponse.body.id}/gastos-variados`,
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
          `${apiGlobalPrefix}/orcamentos/${orcamentoResponse.body.id}/gastos-variados/${gastoId}`,
        )
        .set("Authorization", `Bearer ${userJwt}`)
        .expect(404);

      expect(response.body.message).toBe(
        "O orçamento informado não foi encontrado.",
      );
    });
  });

  describe(`PATCH ${apiGlobalPrefix}/gastos-variados/:id`, () => {
    it("should update an existing gasto variado", async () => {
      const mockDataPgto = new Date();
      mockDataPgto.setUTCHours(0, 0, 0, 0);

      const createGastoDto: GastoVariadoCreateDto = {
        descricao: "Descrição antiga",
        valor: faker.number
          .float({ min: 1, max: 50, fractionDigits: 2 })
          .toString(),
        data_pgto: mockDataPgto,
        categoria_id: categoriaMock.id,
      };

      const createResponse = await request(app.getHttpServer())
        .post(
          `${apiGlobalPrefix}/orcamentos/${orcamentoMock.id}/gastos-variados`,
        )
        .set("Authorization", `Bearer ${userJwt}`)
        .send(createGastoDto)
        .expect(201);

      const gastoId = createResponse.body.id;

      const updateGastoDto: GastoVariadoUpdateDto = {
        descricao: "Gasto Variado D Atualizado",
        valor: "500.35",
        data_pgto: mockDataPgto,
      };

      const response = await request(app.getHttpServer())
        .patch(
          `${apiGlobalPrefix}/orcamentos/${orcamentoMock.id}/gastos-variados/${gastoId}`,
        )
        .set("Authorization", `Bearer ${userJwt}`)
        .send(updateGastoDto)
        .expect(200);

      expect(response.body.descricao).toBe(updateGastoDto.descricao);
      expect(response.body.valor).toBe(updateGastoDto.valor);
      expect(response.body.data_pgto).toBe(mockDataPgto.toISOString());
    });

    it("should return 400 with correct messages when update a gasto variado when all fields as null", async () => {
      const mockDataPgto = new Date();
      mockDataPgto.setUTCHours(0, 0, 0, 0);

      const createGastoDto: GastoVariadoCreateDto = {
        descricao: "Descrição antiga",
        valor: faker.number
          .float({ min: 1, max: 50, fractionDigits: 2 })
          .toString(),
        data_pgto: mockDataPgto,
        categoria_id: categoriaMock.id,
      };

      const createResponse = await request(app.getHttpServer())
        .post(
          `${apiGlobalPrefix}/orcamentos/${orcamentoMock.id}/gastos-variados`,
        )
        .set("Authorization", `Bearer ${userJwt}`)
        .send(createGastoDto)
        .expect(201);

      const gastoId = createResponse.body.id;

      const updateGastoDto: Required<GastoVariadoUpdateDto> = {
        descricao: null,
        valor: null,
        data_pgto: null,
        categoria_id: null,
        data_inatividade: null,
        observacoes: null,
      };

      const response = await request(app.getHttpServer())
        .patch(
          `${apiGlobalPrefix}/orcamentos/${orcamentoMock.id}/gastos-variados/${gastoId}`,
        )
        .set("Authorization", `Bearer ${userJwt}`)
        .send(updateGastoDto)
        .expect(400);

      expect(response.body).toHaveProperty("message");
      expect(Array.isArray(response.body.message)).toBe(true);

      expect(response.body.message).toEqual([
        "descricao should not be empty",
        "descricao must be a string",
        "valor should not be empty",
        "valor is not a valid decimal number.",
        "categoria_id should not be empty",
        "categoria_id must be an integer number",
      ]);
    });

    it("should return 400 with correct messages when update a gasto variado when all fields as wrong", async () => {
      const mockDataPgto = new Date();
      mockDataPgto.setUTCHours(0, 0, 0, 0);

      const createGastoDto: GastoVariadoCreateDto = {
        descricao: "Descrição antiga",
        valor: faker.number
          .float({ min: 1, max: 50, fractionDigits: 2 })
          .toString(),
        data_pgto: mockDataPgto,
        categoria_id: categoriaMock.id,
      };

      const createResponse = await request(app.getHttpServer())
        .post(
          `${apiGlobalPrefix}/orcamentos/${orcamentoMock.id}/gastos-variados`,
        )
        .set("Authorization", `Bearer ${userJwt}`)
        .send(createGastoDto)
        .expect(201);

      const gastoId = createResponse.body.id;

      const updateGastoDto: Required<GastoVariadoUpdateDto> = {
        descricao: faker.number.int({
          min: 100,
          max: 999,
        }) as unknown as string,
        valor: faker.string.alpha(5),
        data_pgto: faker.number.int({ min: 100, max: 999 }) as unknown as Date,
        categoria_id: faker.string.alpha(5) as unknown as number,
        data_inatividade: faker.number.int({
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
          `${apiGlobalPrefix}/orcamentos/${orcamentoMock.id}/gastos-variados/${gastoId}`,
        )
        .set("Authorization", `Bearer ${userJwt}`)
        .send(updateGastoDto)
        .expect(400);

      expect(response.body).toHaveProperty("message");
      expect(Array.isArray(response.body.message)).toBe(true);

      expect(response.body.message).toEqual([
        "descricao must be a string",
        "valor is not a valid decimal number.",
        "categoria_id must be an integer number",
        "observacoes must be a string",
      ]);
    });

    it("should return 200 when update observacoes", async () => {
      const mockDataPgto = new Date();
      mockDataPgto.setUTCHours(0, 0, 0, 0);

      const createGastoDto: GastoVariadoCreateDto = {
        descricao: "Descrição antiga",
        valor: faker.number
          .float({ min: 1, max: 50, fractionDigits: 2 })
          .toString(),
        data_pgto: mockDataPgto,
        categoria_id: categoriaMock.id,
      };

      const createResponse = await request(app.getHttpServer())
        .post(
          `${apiGlobalPrefix}/orcamentos/${orcamentoMock.id}/gastos-variados`,
        )
        .set("Authorization", `Bearer ${userJwt}`)
        .send(createGastoDto)
        .expect(201);

      const gastoId = createResponse.body.id;

      const updateGastoDto: GastoVariadoUpdateDto = {
        observacoes: faker.string.alphanumeric(5),
      };

      const response = await request(app.getHttpServer())
        .patch(
          `${apiGlobalPrefix}/orcamentos/${orcamentoMock.id}/gastos-variados/${gastoId}`,
        )
        .set("Authorization", `Bearer ${userJwt}`)
        .send(updateGastoDto)
        .expect(200);

      expect(response.body.observacoes).toBe(updateGastoDto.observacoes);
    });

    it("should return 200 when setting observacoes to null.", async () => {
      const mockDataPgto = new Date();
      mockDataPgto.setUTCHours(0, 0, 0, 0);

      const createGastoDto: GastoVariadoCreateDto = {
        descricao: "Descrição antiga",
        valor: faker.number
          .float({ min: 1, max: 50, fractionDigits: 2 })
          .toString(),
        data_pgto: mockDataPgto,
        categoria_id: categoriaMock.id,
      };

      const createResponse = await request(app.getHttpServer())
        .post(
          `${apiGlobalPrefix}/orcamentos/${orcamentoMock.id}/gastos-variados`,
        )
        .set("Authorization", `Bearer ${userJwt}`)
        .send(createGastoDto)
        .expect(201);

      const gastoId = createResponse.body.id;

      const updateGastoDto: GastoVariadoUpdateDto = {
        observacoes: null,
      };

      const response = await request(app.getHttpServer())
        .patch(
          `${apiGlobalPrefix}/orcamentos/${orcamentoMock.id}/gastos-variados/${gastoId}`,
        )
        .set("Authorization", `Bearer ${userJwt}`)
        .send(updateGastoDto)
        .expect(200);

      expect(response.body.observacoes).toBeNull();
    });

    it("should return a 404 error if the gasto variado exists but does not belong to the specified orcamento", async () => {
      const mockDataPgto = new Date();
      mockDataPgto.setUTCHours(0, 0, 0, 0);

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

      const createGastoDto: GastoVariadoCreateDto = {
        descricao: "Descrição antiga",
        valor: faker.number
          .float({ min: 1, max: 50, fractionDigits: 2 })
          .toString(),
        data_pgto: mockDataPgto,
        categoria_id: categoriaMock.id,
      };

      const createResponse = await request(app.getHttpServer())
        .post(
          `${apiGlobalPrefix}/orcamentos/${orcamentoMock.id}/gastos-variados`,
        )
        .set("Authorization", `Bearer ${userJwt}`)
        .send(createGastoDto)
        .expect(201);

      const gastoId = createResponse.body.id;

      const updateGastoDto: GastoVariadoUpdateDto = {
        descricao: "Gasto Variado D Atualizado",
        valor: "500.35",
        data_pgto: mockDataPgto,
      };

      await request(app.getHttpServer())
        .patch(
          `${apiGlobalPrefix}/orcamentos/${orcamento2.body.id}/gastos-variados/${gastoId}`,
        )
        .set("Authorization", `Bearer ${userJwt}`)
        .send(updateGastoDto)
        .expect(404);
    });

    it("should return 409 if add valor with a null data_pgto", async () => {
      const mockDataPgto = new Date();
      mockDataPgto.setUTCHours(0, 0, 0, 0);

      const createGastoDto: GastoVariadoCreateDto = {
        descricao: "Descrição antiga",
        valor: faker.number
          .float({ min: 1, max: 50, fractionDigits: 2 })
          .toString(),
        data_pgto: mockDataPgto,
        categoria_id: categoriaMock.id,
      };

      const createResponse = await request(app.getHttpServer())
        .post(
          `${apiGlobalPrefix}/orcamentos/${orcamentoMock.id}/gastos-variados`,
        )
        .set("Authorization", `Bearer ${userJwt}`)
        .send(createGastoDto)
        .expect(201);

      const gastoId = createResponse.body.id;

      const updateGastoDto: GastoVariadoUpdateDto = {
        descricao: "Gasto Variado D Atualizado",
        valor: "500.35",
        data_pgto: null,
      };

      const response = await request(app.getHttpServer())
        .patch(
          `${apiGlobalPrefix}/orcamentos/${orcamentoMock.id}/gastos-variados/${gastoId}`,
        )
        .set("Authorization", `Bearer ${userJwt}`)
        .send(updateGastoDto)
        .expect(409);

      expect(response.body.message).toBe(
        "Se o valor for preenchido, a data_pgto também deve ser preenchida.",
      );
    });

    it("should return 404 if gasto variado not found for update", async () => {
      const updateGastoDto: GastoVariadoUpdateDto = {
        descricao: "Gasto Variado E Atualizado",
        valor: "600.00",
      };

      await request(app.getHttpServer())
        .patch(
          `${apiGlobalPrefix}/orcamentos/${orcamentoMock.id}/gastos-variados/9999`,
        )
        .set("Authorization", `Bearer ${userJwt}`)
        .send(updateGastoDto)
        .expect(404);
    });

    it("should return 404 if gasto variado was soft deleted", async () => {
      const createGastoDto: GastoVariadoCreateDto = {
        descricao: "Descrição antiga",
        valor: faker.number
          .float({ min: 1, max: 50, fractionDigits: 2 })
          .toString(),
        data_pgto: new Date(),
        categoria_id: categoriaMock.id,
      };

      const createResponse = await request(app.getHttpServer())
        .post(
          `${apiGlobalPrefix}/orcamentos/${orcamentoMock.id}/gastos-variados`,
        )
        .set("Authorization", `Bearer ${userJwt}`)
        .send(createGastoDto)
        .expect(201);

      const gastoId = createResponse.body.id;

      await request(app.getHttpServer())
        .delete(
          `${apiGlobalPrefix}/orcamentos/${orcamentoMock.id}/gastos-variados/${createResponse.body.id}`,
        )
        .set("Authorization", `Bearer ${userJwt}`)
        .expect(200);

      const updateGastoDto: GastoVariadoUpdateDto = {
        descricao: "Gasto Variado D Atualizado",
        valor: "500.35",
      };

      await request(app.getHttpServer())
        .patch(
          `${apiGlobalPrefix}/orcamentos/${orcamentoMock.id}/gastos-variados/${gastoId}`,
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

      const createGastoDto: GastoVariadoCreateDto = {
        descricao: "Descrição antiga",
        valor: faker.number
          .float({ min: 1, max: 50, fractionDigits: 2 })
          .toString(),
        data_pgto: new Date(),
        categoria_id: categoriaMock.id,
      };

      const createResponse = await request(app.getHttpServer())
        .post(
          `${apiGlobalPrefix}/orcamentos/${orcamentoResponse.body.id}/gastos-variados`,
        )
        .set("Authorization", `Bearer ${userJwt}`)
        .send(createGastoDto)
        .expect(201);

      const gastoId = createResponse.body.id;

      await request(app.getHttpServer())
        .delete(`${apiGlobalPrefix}/orcamentos/${orcamentoResponse.body.id}`)
        .set("Authorization", `Bearer ${userJwt}`)
        .expect(200);

      const updateGastoDto: GastoVariadoUpdateDto = {
        descricao: "Gasto Variado D Atualizado",
        valor: "500.35",
      };

      const response = await request(app.getHttpServer())
        .patch(
          `${apiGlobalPrefix}/orcamentos/${orcamentoResponse.body.id}/gastos-variados/${gastoId}`,
        )
        .set("Authorization", `Bearer ${userJwt}`)
        .send(updateGastoDto)
        .expect(404);

      expect(response.body.message).toBe(
        "O orçamento informado não foi encontrado.",
      );
    });
  });

  describe(`DELETE ${apiGlobalPrefix}/gastos-variados/:id`, () => {
    it("should soft delete a gasto variado", async () => {
      const mockDataPgto = new Date();
      mockDataPgto.setUTCHours(0, 0, 0, 0);

      const createGastoDto: GastoVariadoCreateDto = {
        descricao: faker.string.alphanumeric(5),
        valor: faker.number
          .float({ min: 1, max: 50, fractionDigits: 2 })
          .toString(),
        data_pgto: mockDataPgto,
        categoria_id: categoriaMock.id,
      };

      const createResponse = await request(app.getHttpServer())
        .post(
          `${apiGlobalPrefix}/orcamentos/${orcamentoMock.id}/gastos-variados`,
        )
        .set("Authorization", `Bearer ${userJwt}`)
        .send(createGastoDto)
        .expect(201);

      const gastoId = createResponse.body.id;

      const response = await request(app.getHttpServer())
        .delete(
          `${apiGlobalPrefix}/orcamentos/${orcamentoMock.id}/gastos-variados/${gastoId}`,
        )
        .set("Authorization", `Bearer ${userJwt}`)
        .expect(200);

      expect(response.body.soft_delete).toBeTruthy();
    });

    it("should return 404 if gasto variado not found for delete", async () => {
      await request(app.getHttpServer())
        .delete(
          `${apiGlobalPrefix}/orcamentos/${orcamentoMock.id}/gastos-variados/9999`,
        )
        .set("Authorization", `Bearer ${userJwt}`)
        .expect(404);
    });

    it("should return a 404 error if the gasto variado exists but does not belong to the specified orcamento", async () => {
      const mockDataPgto = new Date();
      mockDataPgto.setUTCHours(0, 0, 0, 0);

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

      const createGastoDto: GastoVariadoCreateDto = {
        descricao: faker.string.alphanumeric(5),
        valor: faker.number
          .float({ min: 1, max: 50, fractionDigits: 2 })
          .toString(),
        data_pgto: mockDataPgto,
        categoria_id: categoriaMock.id,
      };

      const createResponse = await request(app.getHttpServer())
        .post(
          `${apiGlobalPrefix}/orcamentos/${orcamentoMock.id}/gastos-variados`,
        )
        .set("Authorization", `Bearer ${userJwt}`)
        .send(createGastoDto)
        .expect(201);

      const gastoId = createResponse.body.id;

      await request(app.getHttpServer())
        .delete(
          `${apiGlobalPrefix}/orcamentos/${orcamento2.body.id}/gastos-variados/${gastoId}`,
        )
        .set("Authorization", `Bearer ${userJwt}`)
        .expect(404);
    });

    it("should return a 404 error if the gasto variado was soft deleted", async () => {
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

      const createGastoDto: GastoVariadoCreateDto = {
        descricao: faker.string.alphanumeric(5),
        valor: faker.number
          .float({ min: 1, max: 50, fractionDigits: 2 })
          .toString(),
        data_pgto: new Date(),
        categoria_id: categoriaMock.id,
      };

      const createResponse = await request(app.getHttpServer())
        .post(
          `${apiGlobalPrefix}/orcamentos/${orcamentoResponse.body.id}/gastos-variados`,
        )
        .set("Authorization", `Bearer ${userJwt}`)
        .send(createGastoDto)
        .expect(201);

      const gastoId = createResponse.body.id;

      await request(app.getHttpServer())
        .delete(
          `${apiGlobalPrefix}/orcamentos/${orcamentoResponse.body.id}/gastos-variados/${gastoId}`,
        )
        .set("Authorization", `Bearer ${userJwt}`)
        .expect(200);

      await request(app.getHttpServer())
        .delete(
          `${apiGlobalPrefix}/orcamentos/${orcamentoResponse.body.id}/gastos-variados/${gastoId}`,
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

      const createGastoDto: GastoVariadoCreateDto = {
        descricao: faker.string.alphanumeric(5),
        valor: faker.number
          .float({ min: 1, max: 50, fractionDigits: 2 })
          .toString(),
        data_pgto: new Date(),
        categoria_id: categoriaMock.id,
      };

      const createResponse = await request(app.getHttpServer())
        .post(
          `${apiGlobalPrefix}/orcamentos/${orcamentoResponse.body.id}/gastos-variados`,
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
          `${apiGlobalPrefix}/orcamentos/${orcamentoResponse.body.id}/gastos-variados/${gastoId}`,
        )
        .set("Authorization", `Bearer ${userJwt}`)
        .expect(404);

      expect(response.body.message).toBe(
        "O orçamento informado não foi encontrado.",
      );
    });
  });
});

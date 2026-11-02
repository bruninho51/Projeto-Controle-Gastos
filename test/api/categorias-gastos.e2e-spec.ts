import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import { CategoriasGastosModule } from "../../src/modules/api/categorias-gastos/categorias-gastos.module";
import { PrismaService } from "../../src/modules/prisma/prisma.service";
import { CategoriaGastoCreateDto } from "../../src/modules/api/categorias-gastos/dtos/CategoriaGastoCreate.dto";
import * as request from "supertest";
import { globalPipes } from "../../src/pipes/globalPipes";
import { globalFilters } from "../../src/filters/global-filters";
import { globalInterceptors } from "../../src/interceptors/globalInterceptors";
import { runPrismaMigrations } from "../utils/run-prisma-migrations";
import { faker } from "@faker-js/faker";
import { CategoriaGastoUpdateDto } from "../../src/modules/api/categorias-gastos/dtos/CategoriaGastoUpdate.dto";
import { TipoCategoriaGasto, Usuario } from "@prisma/client";
import { AuthService } from "../../src/modules/api/auth/auth.service";
import { AuthModule } from "../../src/modules/api/auth/auth.module";

jest.setTimeout(10000); // 10 segundos

const apiGlobalPrefix = "/api/v1";

describe("CategoriasGastosController (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authService: AuthService;
  let user: Usuario;
  let userJwt: string;

  beforeAll(async () => {
    await runPrismaMigrations();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [CategoriasGastosModule, AuthModule],
    }).compile();

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

  afterAll(async () => {
    await app.close();
  });

  describe(`GET ${apiGlobalPrefix}/categorias-gastos`, () => {
    it("should return an array of categorias de gastos", async () => {
      await prisma.categoriaGasto.create({
        data: {
          nome: faker.string.alpha(5),
          usuario_id: user.id,
        },
      });

      const response = await request(app.getHttpServer())
        .get(`${apiGlobalPrefix}/categorias-gastos`)
        .set("Authorization", `Bearer ${userJwt}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body[0]).toHaveProperty("id");
      expect(response.body[0]).toHaveProperty("nome");
    });

    it("should not return soft deleted categorias de gastos", async () => {
      const categoria = await prisma.categoriaGasto.create({
        data: {
          nome: "Teste",
          soft_delete: new Date(),
          usuario_id: user.id,
        },
      });

      const response = await request(app.getHttpServer())
        .get(`${apiGlobalPrefix}/categorias-gastos`)
        .set("Authorization", `Bearer ${userJwt}`);

      const result = response.body.filter((c) => c.id === categoria.id);

      expect(result.length).toBe(0);
    });
  });

  describe(`GET ${apiGlobalPrefix}/categorias-gastos?tipo`, () => {
    it("should filter categorias by tipo", async () => {
      const patrimonio = await prisma.categoriaGasto.create({
        data: {
          nome: faker.string.alphanumeric(8),
          tipo: TipoCategoriaGasto.PATRIMONIO,
          usuario_id: user.id,
        },
      });

      const response = await request(app.getHttpServer())
        .get(`${apiGlobalPrefix}/categorias-gastos?tipo=PATRIMONIO`)
        .set("Authorization", `Bearer ${userJwt}`)
        .expect(200);

      expect(response.body.map((c) => c.id)).toContain(patrimonio.id);
      expect(
        response.body.every((c) => c.tipo === TipoCategoriaGasto.PATRIMONIO),
      ).toBe(true);
    });
  });

  describe(`POST ${apiGlobalPrefix}/categorias-gastos`, () => {
    it("should create a new categoria de gasto", async () => {
      const newCategoria: CategoriaGastoCreateDto = {
        nome: faker.string.alphanumeric(6).toUpperCase(),
      };

      const response = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/categorias-gastos`)
        .set("Authorization", `Bearer ${userJwt}`)
        .send(newCategoria)
        .expect(201);

      expect(response.body).toHaveProperty("id");
      expect(response.body.nome).toBe(newCategoria.nome);
    });

    it("should default tipo to DESPESA and accept PATRIMONIO", async () => {
      const padrao = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/categorias-gastos`)
        .set("Authorization", `Bearer ${userJwt}`)
        .send({ nome: faker.string.alphanumeric(8) })
        .expect(201);
      expect(padrao.body.tipo).toBe(TipoCategoriaGasto.DESPESA);

      const patrimonio = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/categorias-gastos`)
        .set("Authorization", `Bearer ${userJwt}`)
        .send({
          nome: faker.string.alphanumeric(8),
          tipo: TipoCategoriaGasto.PATRIMONIO,
        })
        .expect(201);
      expect(patrimonio.body.tipo).toBe(TipoCategoriaGasto.PATRIMONIO);
    });

    it("should return 400 when tipo is invalid", async () => {
      await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/categorias-gastos`)
        .set("Authorization", `Bearer ${userJwt}`)
        .send({ nome: faker.string.alphanumeric(8), tipo: "INVALIDO" })
        .expect(400);
    });

    it("should return 400 with correct messages when create a new categoria gasto when all fields as null", async () => {
      const newCategoria: Required<CategoriaGastoCreateDto> = {
        nome: null,
        tipo: undefined,
      };

      const response = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/categorias-gastos`)
        .set("Authorization", `Bearer ${userJwt}`)
        .send(newCategoria)
        .expect(400);

      expect(response.body.statusCode).toBe(400);
      expect(response.body).toHaveProperty("message");
      expect(Array.isArray(response.body.message)).toBe(true);

      expect(response.body.message).toEqual([
        "nome should not be empty",
        "nome must be a string",
      ]);
    });

    it("should return 400 with correct messages when create a new categoria gasto when all fields as wrong", async () => {
      const newCategoria: Required<CategoriaGastoCreateDto> = {
        nome: faker.number.int({ min: 100, max: 999 }) as unknown as string,
        tipo: undefined,
      };

      const response = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/categorias-gastos`)
        .set("Authorization", `Bearer ${userJwt}`)
        .send(newCategoria)
        .expect(400);

      expect(response.body.statusCode).toBe(400);
      expect(response.body).toHaveProperty("message");
      expect(Array.isArray(response.body.message)).toBe(true);

      expect(response.body.message).toEqual(["nome must be a string"]);
    });

    it("should create categoria gasto even if it has already been created and deleted (soft delete)", async () => {
      const nome = faker.string.alphanumeric(6).toUpperCase();

      const categoria_gasto = await prisma.categoriaGasto.create({
        data: {
          nome,
          usuario_id: user.id,
        },
      });

      await prisma.categoriaGasto.update({
        where: { id: categoria_gasto.id },
        data: {
          soft_delete: new Date(),
        },
      });

      const response = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/categorias-gastos`)
        .set("Authorization", `Bearer ${userJwt}`)
        .send({ nome })
        .expect(201);

      expect(response.body).toHaveProperty("id");
      expect(response.body.id).not.toBe(categoria_gasto.id);
      expect(response.body.nome).toBe(nome);
    });

    it("should return 409 if name exists when create", async () => {
      const nome = faker.string.alphanumeric(6).toUpperCase();
      await prisma.categoriaGasto.create({
        data: {
          nome,
          usuario_id: user.id,
        },
      });

      const newCategoria: CategoriaGastoCreateDto = {
        nome,
      };

      const response = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/categorias-gastos`)
        .set("Authorization", `Bearer ${userJwt}`)
        .send(newCategoria)
        .expect(409);

      expect(response.body.statusCode).toBe(409);
      expect(response.body.message).toBe(
        "A categoria já existe. Por favor, escolha outro nome.",
      );
    });

    it("should return 400 on pass an invalid field on create a categoria de gasto", async () => {
      const nome = faker.string.alphanumeric(6).toUpperCase();

      const newCategoria = {
        nome,
        stanger_field: "hello",
      } as CategoriaGastoCreateDto;

      const response = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/categorias-gastos`)
        .set("Authorization", `Bearer ${userJwt}`)
        .send(newCategoria)
        .expect(400);

      expect(response.body.statusCode).toBe(400);
    });

    it("should return a 400 error if invalid data is passed", async () => {
      const invalidCategoria = {};

      const response = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/categorias-gastos`)
        .set("Authorization", `Bearer ${userJwt}`)
        .send(invalidCategoria)
        .expect(400);

      expect(response.body.statusCode).toBe(400);
      expect(response.body.message).toBeDefined();
    });
  });

  describe(`PATCH ${apiGlobalPrefix}/categorias-gastos/:id`, () => {
    it("should return 404 if try to update a categoria de gasto was deleted (soft delete)", async () => {
      const nome = faker.string.alphanumeric(6).toUpperCase();
      const categoria = await prisma.categoriaGasto.create({
        data: {
          nome,
          soft_delete: new Date(),
          usuario_id: user.id,
        },
      });

      const response = await request(app.getHttpServer())
        .patch(`${apiGlobalPrefix}/categorias-gastos/${categoria.id}`)
        .set("Authorization", `Bearer ${userJwt}`)
        .send({ nome })
        .expect(404);

      expect(response.body.statusCode).toBe(404);
    });

    it("should update a categoria de gasto", async () => {
      const nome = faker.string.alphanumeric(6).toUpperCase();
      const categoria = await prisma.categoriaGasto.create({
        data: {
          nome,
          usuario_id: user.id,
        },
      });

      const response = await request(app.getHttpServer())
        .patch(`${apiGlobalPrefix}/categorias-gastos/${categoria.id}`)
        .set("Authorization", `Bearer ${userJwt}`)
        .send({ nome })
        .expect(200);

      expect(response.body.id).toBe(categoria.id);
      expect(response.body.nome).toBe(nome);
    });

    it("should return 200 when inactivate a categoria gasto", async () => {
      const nome = faker.string.alphanumeric(6).toUpperCase();
      const categoria = await prisma.categoriaGasto.create({
        data: {
          nome,
          usuario_id: user.id,
        },
      });

      const updatedCategoria: CategoriaGastoUpdateDto = {
        data_inatividade: new Date(),
      };

      const response = await request(app.getHttpServer())
        .patch(`${apiGlobalPrefix}/categorias-gastos/${categoria.id}`)
        .set("Authorization", `Bearer ${userJwt}`)
        .send(updatedCategoria)
        .expect(200);

      expect(response.body.data_inatividade).toBeTruthy();
    });

    it("should return 200 when activate a categoria gasto", async () => {
      const nome = faker.string.alphanumeric(6).toUpperCase();
      const categoria = await prisma.categoriaGasto.create({
        data: {
          nome,
          usuario_id: user.id,
        },
      });

      const updatedCategoria: CategoriaGastoUpdateDto = {
        data_inatividade: null,
      };

      const response = await request(app.getHttpServer())
        .patch(`${apiGlobalPrefix}/categorias-gastos/${categoria.id}`)
        .set("Authorization", `Bearer ${userJwt}`)
        .send(updatedCategoria)
        .expect(200);

      expect(response.body.data_inatividade).toBeNull();
    });

    it("should change tipo of a categoria without gastos", async () => {
      const categoria = await prisma.categoriaGasto.create({
        data: { nome: faker.string.alphanumeric(8), usuario_id: user.id },
      });

      const response = await request(app.getHttpServer())
        .patch(`${apiGlobalPrefix}/categorias-gastos/${categoria.id}`)
        .set("Authorization", `Bearer ${userJwt}`)
        .send({ tipo: TipoCategoriaGasto.PATRIMONIO })
        .expect(200);

      expect(response.body.tipo).toBe(TipoCategoriaGasto.PATRIMONIO);
    });

    it("should return 409 when changing tipo of a categoria that has gastos", async () => {
      const categoria = await prisma.categoriaGasto.create({
        data: { nome: faker.string.alphanumeric(8), usuario_id: user.id },
      });
      const orcamento = await prisma.orcamento.create({
        data: {
          nome: faker.string.alphanumeric(5),
          valor_inicial: "1000",
          usuario_id: user.id,
        },
      });
      await prisma.gastoVariado.create({
        data: {
          descricao: "Gasto",
          valor: "10",
          data_pgto: new Date(),
          categoria_id: categoria.id,
          orcamento_id: orcamento.id,
        },
      });

      await request(app.getHttpServer())
        .patch(`${apiGlobalPrefix}/categorias-gastos/${categoria.id}`)
        .set("Authorization", `Bearer ${userJwt}`)
        .send({ tipo: TipoCategoriaGasto.PATRIMONIO })
        .expect(409);

      const view = await prisma.$queryRaw<{ categoria_tipo: string }[]>`
        SELECT categoria_tipo FROM vw_gastos_ativos WHERE gasto_categoria_id = ${categoria.id}`;
      expect(view).toEqual([{ categoria_tipo: TipoCategoriaGasto.DESPESA }]);
    });

    it("should return 400 with correct messages when update a categoria gasto when all fields as null", async () => {
      const nome = faker.string.alphanumeric(6).toUpperCase();
      const categoria = await prisma.categoriaGasto.create({
        data: { nome, usuario_id: user.id },
      });

      const response = await request(app.getHttpServer())
        .patch(`${apiGlobalPrefix}/categorias-gastos/${categoria.id}`)
        .set("Authorization", `Bearer ${userJwt}`)
        .send({ nome: null, data_inatividade: null })
        .expect(400);

      expect(response.body).toHaveProperty("message");
      expect(Array.isArray(response.body.message)).toBe(true);

      expect(response.body.message).toEqual([
        "nome should not be empty",
        "nome must be a string",
      ]);
      expect(response.body.statusCode).toBe(400);
    });

    it("should return 400 with correct messages when update a categoria gasto when all fields as wrong", async () => {
      const nome = faker.string.alphanumeric(6).toUpperCase();
      const categoria = await prisma.categoriaGasto.create({
        data: {
          nome,
          usuario_id: user.id,
        },
      });

      const updatedCategoria: Required<CategoriaGastoUpdateDto> = {
        nome: faker.number.int({ min: 100, max: 999 }) as unknown as string,
        tipo: undefined,
        data_inatividade: faker.string.alpha(5) as unknown as Date,
      };

      const response = await request(app.getHttpServer())
        .patch(`${apiGlobalPrefix}/categorias-gastos/${categoria.id}`)
        .set("Authorization", `Bearer ${userJwt}`)
        .send(updatedCategoria)
        .expect(400);

      expect(response.body).toHaveProperty("message");
      expect(Array.isArray(response.body.message)).toBe(true);

      expect(response.body.message).toEqual([
        "nome must be a string",
        "data_inatividade must be a Date instance",
      ]);
    });

    it("should return 404 if categoria de gasto does not exist", async () => {
      const nome = faker.string.alphanumeric(6).toUpperCase();
      const response = await request(app.getHttpServer())
        .patch(`${apiGlobalPrefix}/categorias-gastos/999`)
        .set("Authorization", `Bearer ${userJwt}`)
        .send({ nome })
        .expect(404);

      expect(response.body.statusCode).toBe(404);
    });

    it("should return 409 if name exists when update", async () => {
      const nome1 = faker.string.alphanumeric(6).toUpperCase();
      const nome2 = faker.string.alphanumeric(6).toUpperCase();

      const categoriaGasto1 = await prisma.categoriaGasto.create({
        data: { nome: nome1, usuario_id: user.id },
      });

      await prisma.categoriaGasto.create({
        data: { nome: nome2, usuario_id: user.id },
      });

      const response = await request(app.getHttpServer())
        .patch(`${apiGlobalPrefix}/categorias-gastos/${categoriaGasto1.id}`)
        .set("Authorization", `Bearer ${userJwt}`)
        .send({ nome: nome2 })
        .expect(409);

      expect(response.body.statusCode).toBe(409);
    });
  });

  describe(`DELETE ${apiGlobalPrefix}/categorias-gastos/:id`, () => {
    it("should soft delete a categoria de gasto", async () => {
      const nome = faker.string.alphanumeric(6).toUpperCase();
      const categoria = await prisma.categoriaGasto.create({
        data: {
          nome,
          usuario_id: user.id,
        },
      });

      const response = await request(app.getHttpServer())
        .delete(`${apiGlobalPrefix}/categorias-gastos/${categoria.id}`)
        .set("Authorization", `Bearer ${userJwt}`)
        .expect(200);

      await request(app.getHttpServer())
        .get(`${apiGlobalPrefix}/categorias-gastos/${categoria.id}`)
        .set("Authorization", `Bearer ${userJwt}`)
        .expect(404);
    });

    it("should return 404 if categoria de gasto was deleted (soft delete)", async () => {
      const nome = faker.string.alphanumeric(6).toUpperCase();
      const categoria = await prisma.categoriaGasto.create({
        data: { nome, usuario_id: user.id },
      });

      await request(app.getHttpServer())
        .delete(`${apiGlobalPrefix}/categorias-gastos/${categoria.id}`)
        .set("Authorization", `Bearer ${userJwt}`)
        .expect(200);

      const response = await request(app.getHttpServer())
        .delete(`${apiGlobalPrefix}/categorias-gastos/${categoria.id}`)
        .set("Authorization", `Bearer ${userJwt}`)
        .expect(404);

      expect(response.body.statusCode).toBe(404);
    });

    it("should return 404 if categoria de gasto does not exist", async () => {
      const response = await request(app.getHttpServer())
        .delete(`${apiGlobalPrefix}/categorias-gastos/999`)
        .set("Authorization", `Bearer ${userJwt}`)
        .expect(404);

      expect(response.body.statusCode).toBe(404);
    });
  });
});

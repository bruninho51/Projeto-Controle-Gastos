import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { PrismaService } from "../../src/modules/prisma/prisma.service";
import { TokensDispositivosModule } from "../../src/modules/api/tokens-dispositivos/tokens-dispositivos.module";
import { TokenDispositivoUpsertDto } from "../../src/modules/api/tokens-dispositivos/dtos/TokenDispositivoUpsert.dto";
import { globalPipes } from "../../src/pipes/globalPipes";
import { globalFilters } from "../../src/filters/global-filters";
import { globalInterceptors } from "../../src/interceptors/globalInterceptors";
import { runPrismaMigrations } from "../utils/run-prisma-migrations";
import { faker } from "@faker-js/faker";
import { Usuario } from "@prisma/client";
import { AuthService } from "../../src/modules/api/auth/auth.service";
import { AuthModule } from "../../src/modules/api/auth/auth.module";

jest.setTimeout(10000); // 10 segundos

const apiGlobalPrefix = "/api/v1";

describe("TokensDispositivosController (v1) (E2E)", () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let authService: AuthService;
  let user: Usuario;
  let userJwt: string;
  let otherUser: Usuario;
  let otherUserJwt: string;

  beforeAll(async () => {
    await runPrismaMigrations();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TokensDispositivosModule, AuthModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.setGlobalPrefix(apiGlobalPrefix);

    prismaService = moduleFixture.get<PrismaService>(PrismaService);
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

    otherUser = await authService.findOrCreateUser({
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

    otherUserJwt = await authService.generateJwt(otherUser);

    globalPipes.forEach((gp) => app.useGlobalPipes(gp));
    globalFilters.forEach((gf) => app.useGlobalFilters(gf));
    globalInterceptors.forEach((gi) => app.useGlobalInterceptors(gi));

    await app.init();
  });

  afterAll(async () => {
    await prismaService.$disconnect();
    await app.close();
  });

  describe(`PUT ${apiGlobalPrefix}/tokens-dispositivos`, () => {
    it("should create a new token de dispositivo", async () => {
      const dto: TokenDispositivoUpsertDto = {
        token: faker.string.alphanumeric(64),
        plataforma: "android",
      };

      const response = await request(app.getHttpServer())
        .put(`${apiGlobalPrefix}/tokens-dispositivos`)
        .set("Authorization", `Bearer ${userJwt}`)
        .send(dto)
        .expect(200);

      expect(response.body).toHaveProperty("id");
      expect(response.body.token).toBe(dto.token);
      expect(response.body.plataforma).toBe(dto.plataforma);
      expect(response.body.usuario_id).toBe(user.id);
    });

    it("should update an existing token de dispositivo when token already exists", async () => {
      const token = faker.string.alphanumeric(64);

      const dto: TokenDispositivoUpsertDto = {
        token,
        plataforma: "android",
      };

      const createResponse = await request(app.getHttpServer())
        .put(`${apiGlobalPrefix}/tokens-dispositivos`)
        .set("Authorization", `Bearer ${userJwt}`)
        .send(dto)
        .expect(200);

      const updatedDto: TokenDispositivoUpsertDto = {
        token,
        plataforma: "ios",
      };

      const updateResponse = await request(app.getHttpServer())
        .put(`${apiGlobalPrefix}/tokens-dispositivos`)
        .set("Authorization", `Bearer ${userJwt}`)
        .send(updatedDto)
        .expect(200);

      expect(updateResponse.body.id).toBe(createResponse.body.id);
      expect(updateResponse.body.token).toBe(token);
      expect(updateResponse.body.plataforma).toBe("ios");
      expect(updateResponse.body.usuario_id).toBe(user.id);
    });

    it("should reassign token to new user when token already exists for another user", async () => {
      const token = faker.string.alphanumeric(64);

      await request(app.getHttpServer())
        .put(`${apiGlobalPrefix}/tokens-dispositivos`)
        .set("Authorization", `Bearer ${userJwt}`)
        .send({ token, plataforma: "android" } as TokenDispositivoUpsertDto)
        .expect(200);

      const response = await request(app.getHttpServer())
        .put(`${apiGlobalPrefix}/tokens-dispositivos`)
        .set("Authorization", `Bearer ${otherUserJwt}`)
        .send({ token, plataforma: "android" } as TokenDispositivoUpsertDto)
        .expect(200);

      expect(response.body.usuario_id).toBe(otherUser.id);
    });

    it("should return 400 when token is empty", async () => {
      const dto = {
        token: "",
        plataforma: "android",
      };

      const response = await request(app.getHttpServer())
        .put(`${apiGlobalPrefix}/tokens-dispositivos`)
        .set("Authorization", `Bearer ${userJwt}`)
        .send(dto)
        .expect(400);

      expect(Array.isArray(response.body.message)).toBe(true);
      expect(response.body.message).toContain("token should not be empty");
    });

    it("should return 400 when plataforma is empty", async () => {
      const dto = {
        token: faker.string.alphanumeric(64),
        plataforma: "",
      };

      const response = await request(app.getHttpServer())
        .put(`${apiGlobalPrefix}/tokens-dispositivos`)
        .set("Authorization", `Bearer ${userJwt}`)
        .send(dto)
        .expect(400);

      expect(Array.isArray(response.body.message)).toBe(true);
      expect(response.body.message).toContain("plataforma should not be empty");
    });

    it("should return 400 when all fields are null", async () => {
      const dto = {
        token: null,
        plataforma: null,
      };

      const response = await request(app.getHttpServer())
        .put(`${apiGlobalPrefix}/tokens-dispositivos`)
        .set("Authorization", `Bearer ${userJwt}`)
        .send(dto)
        .expect(400);

      expect(response.body).toHaveProperty("message");
      expect(Array.isArray(response.body.message)).toBe(true);
      expect(response.body.message).toEqual([
        "token must be a string",
        "token should not be empty",
        "token must be shorter than or equal to 512 characters",
        "plataforma must be a string",
        "plataforma should not be empty",
      ]);
    });

    it("should return 400 when token exceeds max length", async () => {
      const dto: TokenDispositivoUpsertDto = {
        token: faker.string.alphanumeric(513),
        plataforma: "android",
      };

      await request(app.getHttpServer())
        .put(`${apiGlobalPrefix}/tokens-dispositivos`)
        .set("Authorization", `Bearer ${userJwt}`)
        .send(dto)
        .expect(400);
    });

    it("should return 401 when no token is provided", async () => {
      const dto: TokenDispositivoUpsertDto = {
        token: faker.string.alphanumeric(64),
        plataforma: "android",
      };

      await request(app.getHttpServer())
        .put(`${apiGlobalPrefix}/tokens-dispositivos`)
        .send(dto)
        .expect(401);
    });
  });

  describe(`GET ${apiGlobalPrefix}/tokens-dispositivos`, () => {
    it("should return all tokens de dispositivos do usuário", async () => {
      // Cria tokens para o usuário atual
      const dto1: TokenDispositivoUpsertDto = {
        token: faker.string.alphanumeric(64),
        plataforma: "android",
      };

      const dto2: TokenDispositivoUpsertDto = {
        token: faker.string.alphanumeric(64),
        plataforma: "ios",
      };

      await request(app.getHttpServer())
        .put(`${apiGlobalPrefix}/tokens-dispositivos`)
        .set("Authorization", `Bearer ${userJwt}`)
        .send(dto1)
        .expect(200);

      await request(app.getHttpServer())
        .put(`${apiGlobalPrefix}/tokens-dispositivos`)
        .set("Authorization", `Bearer ${userJwt}`)
        .send(dto2)
        .expect(200);

      // Cria um token para outro usuário para garantir o isolamento
      await request(app.getHttpServer())
        .put(`${apiGlobalPrefix}/tokens-dispositivos`)
        .set("Authorization", `Bearer ${otherUserJwt}`)
        .send({
          token: faker.string.alphanumeric(64),
          plataforma: "web",
        } as TokenDispositivoUpsertDto)
        .expect(200);

      const response = await request(app.getHttpServer())
        .get(`${apiGlobalPrefix}/tokens-dispositivos`)
        .set("Authorization", `Bearer ${userJwt}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.every((t) => t.usuario_id === user.id)).toBeTruthy();
    });

    it("should not return tokens from other users", async () => {
      const response = await request(app.getHttpServer())
        .get(`${apiGlobalPrefix}/tokens-dispositivos`)
        .set("Authorization", `Bearer ${userJwt}`)
        .expect(200);

      expect(
        response.body.every((t) => t.usuario_id !== otherUser.id),
      ).toBeTruthy();
    });

    it("should return 401 when no token is provided", async () => {
      await request(app.getHttpServer())
        .get(`${apiGlobalPrefix}/tokens-dispositivos`)
        .expect(401);
    });
  });

  describe(`GET ${apiGlobalPrefix}/tokens-dispositivos/:id`, () => {
    it("should return a single token de dispositivo by id", async () => {
      const dto: TokenDispositivoUpsertDto = {
        token: faker.string.alphanumeric(64),
        plataforma: "android",
      };

      const createResponse = await request(app.getHttpServer())
        .put(`${apiGlobalPrefix}/tokens-dispositivos`)
        .set("Authorization", `Bearer ${userJwt}`)
        .send(dto)
        .expect(200);

      const tokenId = createResponse.body.id;

      const response = await request(app.getHttpServer())
        .get(`${apiGlobalPrefix}/tokens-dispositivos/${tokenId}`)
        .set("Authorization", `Bearer ${userJwt}`)
        .expect(200);

      expect(response.body.id).toBe(tokenId);
      expect(response.body.token).toBe(dto.token);
      expect(response.body.plataforma).toBe(dto.plataforma);
      expect(response.body.usuario_id).toBe(user.id);
    });

    it("should return 404 if token de dispositivo not found", async () => {
      const response = await request(app.getHttpServer())
        .get(`${apiGlobalPrefix}/tokens-dispositivos/9999`)
        .set("Authorization", `Bearer ${userJwt}`)
        .expect(404);

      expect(response.body.message).toBe(
        "O token de dispositivo informado não foi encontrado.",
      );
    });

    it("should return 404 if token de dispositivo belongs to another user", async () => {
      const dto: TokenDispositivoUpsertDto = {
        token: faker.string.alphanumeric(64),
        plataforma: "android",
      };

      const createResponse = await request(app.getHttpServer())
        .put(`${apiGlobalPrefix}/tokens-dispositivos`)
        .set("Authorization", `Bearer ${otherUserJwt}`)
        .send(dto)
        .expect(200);

      const tokenId = createResponse.body.id;

      const response = await request(app.getHttpServer())
        .get(`${apiGlobalPrefix}/tokens-dispositivos/${tokenId}`)
        .set("Authorization", `Bearer ${userJwt}`)
        .expect(404);

      expect(response.body.message).toBe(
        "O token de dispositivo informado não foi encontrado.",
      );
    });

    it("should return 401 when no token is provided", async () => {
      await request(app.getHttpServer())
        .get(`${apiGlobalPrefix}/tokens-dispositivos/1`)
        .expect(401);
    });
  });

  describe(`DELETE ${apiGlobalPrefix}/tokens-dispositivos/:id`, () => {
    it("should delete a token de dispositivo", async () => {
      const dto: TokenDispositivoUpsertDto = {
        token: faker.string.alphanumeric(64),
        plataforma: "android",
      };

      const createResponse = await request(app.getHttpServer())
        .put(`${apiGlobalPrefix}/tokens-dispositivos`)
        .set("Authorization", `Bearer ${userJwt}`)
        .send(dto)
        .expect(200);

      const tokenId = createResponse.body.id;

      await request(app.getHttpServer())
        .delete(`${apiGlobalPrefix}/tokens-dispositivos/${tokenId}`)
        .set("Authorization", `Bearer ${userJwt}`)
        .expect(200);

      await request(app.getHttpServer())
        .get(`${apiGlobalPrefix}/tokens-dispositivos/${tokenId}`)
        .set("Authorization", `Bearer ${userJwt}`)
        .expect(404);
    });

    it("should return the deleted token de dispositivo in response", async () => {
      const dto: TokenDispositivoUpsertDto = {
        token: faker.string.alphanumeric(64),
        plataforma: "ios",
      };

      const createResponse = await request(app.getHttpServer())
        .put(`${apiGlobalPrefix}/tokens-dispositivos`)
        .set("Authorization", `Bearer ${userJwt}`)
        .send(dto)
        .expect(200);

      const tokenId = createResponse.body.id;

      const deleteResponse = await request(app.getHttpServer())
        .delete(`${apiGlobalPrefix}/tokens-dispositivos/${tokenId}`)
        .set("Authorization", `Bearer ${userJwt}`)
        .expect(200);

      expect(deleteResponse.body.id).toBe(tokenId);
      expect(deleteResponse.body.token).toBe(dto.token);
      expect(deleteResponse.body.plataforma).toBe(dto.plataforma);
    });

    it("should return 404 if token de dispositivo not found for delete", async () => {
      const response = await request(app.getHttpServer())
        .delete(`${apiGlobalPrefix}/tokens-dispositivos/9999`)
        .set("Authorization", `Bearer ${userJwt}`)
        .expect(404);

      expect(response.body.message).toBe(
        "O token de dispositivo informado não foi encontrado.",
      );
    });

    it("should return 404 if token de dispositivo belongs to another user", async () => {
      const dto: TokenDispositivoUpsertDto = {
        token: faker.string.alphanumeric(64),
        plataforma: "android",
      };

      const createResponse = await request(app.getHttpServer())
        .put(`${apiGlobalPrefix}/tokens-dispositivos`)
        .set("Authorization", `Bearer ${otherUserJwt}`)
        .send(dto)
        .expect(200);

      const tokenId = createResponse.body.id;

      const response = await request(app.getHttpServer())
        .delete(`${apiGlobalPrefix}/tokens-dispositivos/${tokenId}`)
        .set("Authorization", `Bearer ${userJwt}`)
        .expect(404);

      expect(response.body.message).toBe(
        "O token de dispositivo informado não foi encontrado.",
      );
    });

    it("should return 404 when trying to delete already deleted token de dispositivo", async () => {
      const dto: TokenDispositivoUpsertDto = {
        token: faker.string.alphanumeric(64),
        plataforma: "android",
      };

      const createResponse = await request(app.getHttpServer())
        .put(`${apiGlobalPrefix}/tokens-dispositivos`)
        .set("Authorization", `Bearer ${userJwt}`)
        .send(dto)
        .expect(200);

      const tokenId = createResponse.body.id;

      await request(app.getHttpServer())
        .delete(`${apiGlobalPrefix}/tokens-dispositivos/${tokenId}`)
        .set("Authorization", `Bearer ${userJwt}`)
        .expect(200);

      await request(app.getHttpServer())
        .delete(`${apiGlobalPrefix}/tokens-dispositivos/${tokenId}`)
        .set("Authorization", `Bearer ${userJwt}`)
        .expect(404);
    });

    it("should return 401 when no token is provided", async () => {
      await request(app.getHttpServer())
        .delete(`${apiGlobalPrefix}/tokens-dispositivos/1`)
        .expect(401);
    });
  });
});

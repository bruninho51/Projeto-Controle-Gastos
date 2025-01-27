import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { PrismaService } from "../../src/modules/prisma/prisma.service";
import { globalPipes } from "../../src/pipes/globalPipes";
import { globalFilters } from "../../src/filters/global-filters";
import { globalInterceptors } from "../../src/interceptors/globalInterceptors";
import { runPrismaMigrations } from "../utils/run-prisma-migrations";
import { faker } from "@faker-js/faker";
import { CategoriaInvestimento, Investimento } from "@prisma/client";
import { LinhaDoTempoInvestimentosModule } from "../../src/modules/api/linha-do-tempo-investimentos/linha-do-tempo-investimentos.module";
import { RegistroInvestimentoLinhaDoTempoCreateDto } from "../../src/modules/api/linha-do-tempo-investimentos/dtos/RegistroInvestimentoLinhaDoTempoCreate.dto";
import { InvestimentoCreateDto } from "../../src/modules/api/investimentos/dtos/InvestimentoCreate.dto";
import { RegistroInvestimentoLinhaDoTempoUpdateDto } from "../../src/modules/api/linha-do-tempo-investimentos/dtos/RegistroInvestimentoLinhaDoTempoUpdate.dto";
import { InvestimentosModule } from "../../src/modules/api/investimentos/investimentos.module";
import { formatValue } from "../utils/format-value";

jest.setTimeout(10000); // 10 segundos

const apiGlobalPrefix = "/api/v1";

describe("LinhaDoTempoInvestimentosController (v1) (E2E)", () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  let categoriaMock: CategoriaInvestimento;
  let investimentoMock: Investimento;

  beforeAll(async () => {
    await runPrismaMigrations();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [LinhaDoTempoInvestimentosModule, InvestimentosModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.setGlobalPrefix(apiGlobalPrefix);

    prismaService = moduleFixture.get<PrismaService>(PrismaService);

    globalPipes.forEach((gp) => app.useGlobalPipes(gp));
    globalFilters.forEach((gf) => app.useGlobalFilters(gf));
    globalInterceptors.forEach((gi) => app.useGlobalInterceptors(gi));

    await app.init();

    categoriaMock = await prismaService.categoriaInvestimento.create({
      data: {
        nome: faker.string.alphanumeric(5),
      },
    });

    investimentoMock = await prismaService.investimento.create({
      data: {
        nome: faker.string.alphanumeric(5),
        descricao: faker.string.alphanumeric(5),
        categoria_id: categoriaMock.id,
        valor_inicial: faker.number
          .float({ min: 1000, max: 10000, fractionDigits: 2 })
          .toString(),
      },
    });
  });

  afterAll(async () => {
    await prismaService.$disconnect();
    await app.close();
  });

  describe(`POST ${apiGlobalPrefix}/investimento/:investimento_id/linha-do-tempo`, () => {
    it("should create a new linha do tempo investimento", async () => {
      const mockDataRegistro = new Date();
      mockDataRegistro.setUTCHours(0, 0, 0, 0);

      const createDto: RegistroInvestimentoLinhaDoTempoCreateDto = {
        valor: faker.number
          .float({ min: 1, max: 50, fractionDigits: 2 })
          .toString(),
        data_registro: mockDataRegistro,
      };

      const response = await request(app.getHttpServer())
        .post(
          `${apiGlobalPrefix}/investimentos/${investimentoMock.id}/linha-do-tempo`,
        )
        .send(createDto)
        .expect(201);

      expect(response.body).toHaveProperty("id");
      expect(response.body.valor).toBe(createDto.valor);
      expect(response.body.data_registro).toBe(mockDataRegistro.toISOString());
    });

    it("should return 400 with correct messages when create a new linha do tempo investimento when all fields as null", async () => {
      const mockDataRegistro = new Date();
      mockDataRegistro.setUTCHours(0, 0, 0, 0);

      const createDto: Required<RegistroInvestimentoLinhaDoTempoCreateDto> = {
        valor: null,
        data_registro: null,
      };

      const response = await request(app.getHttpServer())
        .post(
          `${apiGlobalPrefix}/investimentos/${investimentoMock.id}/linha-do-tempo`,
        )
        .send(createDto)
        .expect(400);

      expect(response.body).toHaveProperty("message");
      expect(Array.isArray(response.body.message)).toBe(true);

      expect(response.body.message).toEqual([
        "valor should not be empty",
        "valor is not a valid decimal number.",
        "data_registro should not be empty",
        "data_registro must be a Date instance",
      ]);
    });

    it("should return 400 with correct messages when create a new linha do tempo investimento when all fields as wrong", async () => {
      const mockDataRegistro = new Date();
      mockDataRegistro.setUTCHours(0, 0, 0, 0);

      const createDto: Required<RegistroInvestimentoLinhaDoTempoCreateDto> = {
        valor: faker.string.alpha(5),
        data_registro: faker.string.alpha(5) as unknown as Date,
      };

      const response = await request(app.getHttpServer())
        .post(
          `${apiGlobalPrefix}/investimentos/${investimentoMock.id}/linha-do-tempo`,
        )
        .send(createDto)
        .expect(400);

      expect(response.body).toHaveProperty("message");
      expect(Array.isArray(response.body.message)).toBe(true);

      expect(response.body.message).toEqual([
        "valor is not a valid decimal number.",
        "data_registro must be a Date instance",
      ]);
    });

    it("should return 400 if data_registro is passed as null", async () => {
      const createDto: RegistroInvestimentoLinhaDoTempoCreateDto = {
        valor: faker.number
          .float({ min: 1, max: 50, fractionDigits: 2 })
          .toString(),
        data_registro: null,
      };

      const response = await request(app.getHttpServer())
        .post(
          `${apiGlobalPrefix}/investimentos/${investimentoMock.id}/linha-do-tempo`,
        )
        .send(createDto)
        .expect(400);

      expect(response.body.message).toEqual([
        "data_registro should not be empty",
        "data_registro must be a Date instance",
      ]);
    });

    it("should return 404 when investimento does not exists", async () => {
      const mockDataRegistro = new Date();
      mockDataRegistro.setUTCHours(0, 0, 0, 0);

      const createDto: RegistroInvestimentoLinhaDoTempoCreateDto = {
        valor: faker.number
          .float({ min: 1, max: 50, fractionDigits: 2 })
          .toString(),
        data_registro: mockDataRegistro,
      };

      const response = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/investimentos/999/linha-do-tempo`)
        .send(createDto)
        .expect(404);

      expect(response.body.message).toBe(
        "O investimento informado não foi encontrado.",
      );
    });

    it("should return 404 when investimento was soft deleted", async () => {
      const mockDataRegistro = new Date();
      mockDataRegistro.setUTCHours(0, 0, 0, 0);

      const createInvestimentoDto: InvestimentoCreateDto = {
        nome: faker.string.alphanumeric(5),
        descricao: faker.string.alphanumeric(5),
        valor_inicial: formatValue(
          faker.number.float({ min: 1000, max: 9999, fractionDigits: 2 }),
        ),
        categoria_id: 1,
      };

      const responseInvestimento = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/investimentos`)
        .send(createInvestimentoDto)
        .expect(201);

      await request(app.getHttpServer())
        .delete(
          `${apiGlobalPrefix}/investimentos/${responseInvestimento.body.id}`,
        )
        .expect(200);

      const createDto: RegistroInvestimentoLinhaDoTempoCreateDto = {
        valor: faker.number
          .float({ min: 1, max: 50, fractionDigits: 2 })
          .toString(),
        data_registro: mockDataRegistro,
      };

      const response = await request(app.getHttpServer())
        .post(
          `${apiGlobalPrefix}/investimentos/${responseInvestimento.body.id}/linha-do-tempo`,
        )
        .send(createDto)
        .expect(404);

      expect(response.body.message).toBe(
        "O investimento informado não foi encontrado.",
      );
    });

    it("should return 400 on passing an invalid field on create a new linha do tempo investimento", async () => {
      const mockDataRegistro = new Date();
      mockDataRegistro.setUTCHours(0, 0, 0, 0);

      const createDto = {
        valor: faker.number
          .float({ min: 1, max: 50, fractionDigits: 2 })
          .toString(),
        data_registro: mockDataRegistro,
        invalid_field: "invalid",
      } as RegistroInvestimentoLinhaDoTempoCreateDto;

      await request(app.getHttpServer())
        .post(
          `${apiGlobalPrefix}/investimentos/${investimentoMock.id}/linha-do-tempo`,
        )
        .send(createDto)
        .expect(400);
    });
  });

  describe(`GET ${apiGlobalPrefix}/investimentos/:investimento_id/linha-do-tempo`, () => {
    it("should return all linha do tempo investimento", async () => {
      const mockDataRegistro = new Date();
      mockDataRegistro.setUTCHours(0, 0, 0, 0);

      const investimentoMock2: InvestimentoCreateDto = {
        nome: faker.string.alphanumeric(5),
        descricao: faker.string.alphanumeric(5),
        valor_inicial: faker.number
          .float({ min: 100, max: 999, fractionDigits: 2 })
          .toString(),
        categoria_id: categoriaMock.id,
      };

      const investimento2 = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/investimentos`)
        .send(investimentoMock2)
        .expect(201);

      const linhaDoTempoInvestimento2: RegistroInvestimentoLinhaDoTempoCreateDto =
        {
          valor: faker.number
            .float({ min: 100, max: 999, fractionDigits: 2 })
            .toString(),
          data_registro: mockDataRegistro,
        };

      await request(app.getHttpServer())
        .post(
          `${apiGlobalPrefix}/investimentos/${investimentoMock2}/linha-do-tempo`,
        )
        .send(linhaDoTempoInvestimento2)
        .expect(201);

      const responseInvestimentoMock = await request(app.getHttpServer())
        .get(
          `${apiGlobalPrefix}/investimentos/${investimentoMock.id}/linha-do-tempo`,
        )
        .expect(200);

      const responseInvestimentoMock2 = await request(app.getHttpServer())
        .get(
          `${apiGlobalPrefix}/investimentos/${investimento2.body.id}/linha-do-tempo`,
        )
        .expect(200);

      const investimento1Ok = responseInvestimentoMock.body.every(
        (reg) => reg.investimento_id === investimentoMock.id,
      );
      const investimento2Ok = responseInvestimentoMock2.body.every(
        (reg) => reg.investimento_id === investimento2.body.id,
      );

      expect(investimento1Ok).toBeTruthy();
      expect(investimento2Ok).toBeTruthy();
    });

    it("should not return soft deleted linha do tempo investimento", async () => {
      const mockDataRegistro = new Date();
      mockDataRegistro.setUTCHours(0, 0, 0, 0);

      const investimentoMock: InvestimentoCreateDto = {
        nome: faker.string.alphanumeric(5),
        descricao: faker.string.alphanumeric(5),
        valor_inicial: faker.number
          .float({ min: 100, max: 999, fractionDigits: 2 })
          .toString(),
        categoria_id: categoriaMock.id,
      };

      const investimento = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/investimentos`)
        .send(investimentoMock)
        .expect(201);

      const linhaDoTempoInvestimento: RegistroInvestimentoLinhaDoTempoCreateDto =
        {
          valor: faker.number
            .float({ min: 100, max: 999, fractionDigits: 2 })
            .toString(),
          data_registro: mockDataRegistro,
        };

      const linhaDoTempo = await request(app.getHttpServer())
        .post(
          `${apiGlobalPrefix}/investimentos/${investimento.body.id}/linha-do-tempo`,
        )
        .send(linhaDoTempoInvestimento)
        .expect(201);

      await request(app.getHttpServer())
        .delete(
          `${apiGlobalPrefix}/investimentos/${investimento.body.id}/linha-do-tempo/${linhaDoTempo.body.id}`,
        )
        .expect(200);

      const responseInvestimento = await request(app.getHttpServer())
        .get(
          `${apiGlobalPrefix}/investimentos/${investimento.body.id}/linha-do-tempo`,
        )
        .expect(200);

      expect(responseInvestimento.body.length).toBe(0);
    });

    it("should return 404 if investimento does not exists", async () => {
      const mockDataRegistro = new Date();
      mockDataRegistro.setUTCHours(0, 0, 0, 0);

      const linhaDoTempoInvestimento: RegistroInvestimentoLinhaDoTempoCreateDto =
        {
          valor: faker.number
            .float({ min: 100, max: 999, fractionDigits: 2 })
            .toString(),
          data_registro: mockDataRegistro,
        };

      const response = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/investimentos/9999/linha-do-tempo`)
        .send(linhaDoTempoInvestimento)
        .expect(404);

      expect(response.body.message).toBe(
        "O investimento informado não foi encontrado.",
      );
    });

    it("should return 404 if investimento was soft deleted", async () => {
      const mockDataRegistro = new Date();
      mockDataRegistro.setUTCHours(0, 0, 0, 0);

      const createInvestimentoDto: InvestimentoCreateDto = {
        nome: faker.string.alphanumeric(5),
        descricao: faker.string.alphanumeric(5),
        valor_inicial: formatValue(
          faker.number.float({ min: 1000, max: 9999, fractionDigits: 2 }),
        ),
        categoria_id: 1,
      };

      const responseInvestimento = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/investimentos`)
        .send(createInvestimentoDto)
        .expect(201);

      await request(app.getHttpServer())
        .delete(
          `${apiGlobalPrefix}/investimentos/${responseInvestimento.body.id}`,
        )
        .expect(200);

      const linhaDoTempoInvestimento: RegistroInvestimentoLinhaDoTempoCreateDto =
        {
          valor: faker.number
            .float({ min: 100, max: 999, fractionDigits: 2 })
            .toString(),
          data_registro: mockDataRegistro,
        };

      const response = await request(app.getHttpServer())
        .post(
          `${apiGlobalPrefix}/investimentos/${responseInvestimento.body.id}/linha-do-tempo`,
        )
        .send(linhaDoTempoInvestimento)
        .expect(404);

      expect(response.body.message).toBe(
        "O investimento informado não foi encontrado.",
      );
    });
  });

  describe(`GET ${apiGlobalPrefix}/investimentos/:investimento_id/linha-do-tempo/:id`, () => {
    it("should return a single linha do tempo investimento", async () => {
      const mockDataRegistro = new Date();
      mockDataRegistro.setUTCHours(0, 0, 0, 0);

      const createDto: RegistroInvestimentoLinhaDoTempoCreateDto = {
        valor: faker.number
          .float({ min: 1, max: 50, fractionDigits: 2 })
          .toString(),
        data_registro: mockDataRegistro,
      };

      const createResponse = await request(app.getHttpServer())
        .post(
          `${apiGlobalPrefix}/investimentos/${investimentoMock.id}/linha-do-tempo`,
        )
        .send(createDto)
        .expect(201);

      const linhaDoTempoId = createResponse.body.id;

      const response = await request(app.getHttpServer())
        .get(
          `${apiGlobalPrefix}/investimentos/${investimentoMock.id}/linha-do-tempo/${linhaDoTempoId}`,
        )
        .expect(200);

      expect(response.body.id).toBe(linhaDoTempoId);
      expect(response.body.valor).toBe(createDto.valor);
      expect(response.body.data_registro).toBe(mockDataRegistro.toISOString());
      expect(response.body.investimento_id).toBe(investimentoMock.id);
    });

    it("should return a 404 error if the linha do tempo investimento exists but does not belong to the specified investimento", async () => {
      const mockDataRegistro = new Date();
      mockDataRegistro.setUTCHours(0, 0, 0, 0);

      const investimentoMock2: InvestimentoCreateDto = {
        nome: faker.string.alphanumeric(5),
        descricao: faker.string.alphanumeric(5),
        valor_inicial: faker.number
          .float({ min: 100, max: 999, fractionDigits: 2 })
          .toString(),
        categoria_id: categoriaMock.id,
      };

      const investimento2 = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/investimentos`)
        .send(investimentoMock2)
        .expect(201);

      const createDto: RegistroInvestimentoLinhaDoTempoCreateDto = {
        valor: faker.number
          .float({ min: 1, max: 50, fractionDigits: 2 })
          .toString(),
        data_registro: mockDataRegistro,
      };

      const createResponse = await request(app.getHttpServer())
        .post(
          `${apiGlobalPrefix}/investimentos/${investimentoMock.id}/linha-do-tempo`,
        )
        .send(createDto)
        .expect(201);

      const linhaDoTempoId = createResponse.body.id;

      await request(app.getHttpServer())
        .get(
          `${apiGlobalPrefix}/investimentos/${investimento2.body.id}/linha-do-tempo/${linhaDoTempoId}`,
        )
        .expect(404);
    });

    it("should return 404 if linha do tempo investimento not found", async () => {
      const response = await request(app.getHttpServer())
        .get(
          `${apiGlobalPrefix}/investimentos/${investimentoMock.id}/linha-do-tempo/9999`,
        )
        .expect(404);

      expect(response.body.message).toBe("Not Found");
    });

    it("should return 404 if linha do tempo investimento was soft deleted", async () => {
      const mockDataRegistro = new Date();
      mockDataRegistro.setUTCHours(0, 0, 0, 0);

      const createDto: RegistroInvestimentoLinhaDoTempoCreateDto = {
        valor: faker.number
          .float({ min: 1, max: 50, fractionDigits: 2 })
          .toString(),
        data_registro: mockDataRegistro,
      };

      const createResponse = await request(app.getHttpServer())
        .post(
          `${apiGlobalPrefix}/investimentos/${investimentoMock.id}/linha-do-tempo`,
        )
        .send(createDto)
        .expect(201);

      const linhaDoTempoId = createResponse.body.id;

      await request(app.getHttpServer())
        .delete(
          `${apiGlobalPrefix}/investimentos/${investimentoMock.id}/linha-do-tempo/${linhaDoTempoId}`,
        )
        .expect(200);

      await request(app.getHttpServer())
        .get(
          `${apiGlobalPrefix}/investimentos/${investimentoMock.id}/linha-do-tempo/${linhaDoTempoId}`,
        )
        .expect(404);
    });

    it("should return 404 if investimento was soft deleted", async () => {
      const mockDataRegistro = new Date();
      mockDataRegistro.setUTCHours(0, 0, 0, 0);

      const investimentoMock: InvestimentoCreateDto = {
        nome: faker.string.alphanumeric(5),
        descricao: faker.string.alphanumeric(5),
        valor_inicial: faker.number
          .float({ min: 100, max: 999, fractionDigits: 2 })
          .toString(),
        categoria_id: categoriaMock.id,
      };

      const investimento = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/investimentos`)
        .send(investimentoMock)
        .expect(201);

      const createDto: RegistroInvestimentoLinhaDoTempoCreateDto = {
        valor: faker.number
          .float({ min: 1, max: 50, fractionDigits: 2 })
          .toString(),
        data_registro: mockDataRegistro,
      };

      const createResponse = await request(app.getHttpServer())
        .post(
          `${apiGlobalPrefix}/investimentos/${investimento.body.id}/linha-do-tempo`,
        )
        .send(createDto)
        .expect(201);

      const linhaDoTempoId = createResponse.body.id;

      await request(app.getHttpServer())
        .delete(`${apiGlobalPrefix}/investimentos/${investimento.body.id}`)
        .expect(200);

      const response = await request(app.getHttpServer())
        .get(
          `${apiGlobalPrefix}/investimentos/${investimento.body.id}/linha-do-tempo/${linhaDoTempoId}`,
        )
        .expect(404);

      expect(response.body.message).toBe(
        "O investimento informado não foi encontrado.",
      );
    });
  });

  describe(`PATCH ${apiGlobalPrefix}/investimentos/:investimento_id/linha-do-tempo/:id`, () => {
    it("should update an existing linha do tempo investimento", async () => {
      const mockDataRegistro = new Date();
      mockDataRegistro.setUTCHours(0, 0, 0, 0);

      const createDto: RegistroInvestimentoLinhaDoTempoCreateDto = {
        valor: faker.number
          .float({ min: 1, max: 50, fractionDigits: 2 })
          .toString(),
        data_registro: mockDataRegistro,
      };

      const createResponse = await request(app.getHttpServer())
        .post(
          `${apiGlobalPrefix}/investimentos/${investimentoMock.id}/linha-do-tempo`,
        )
        .send(createDto)
        .expect(201);

      const linhaDoTempoId = createResponse.body.id;

      const updateDto: RegistroInvestimentoLinhaDoTempoUpdateDto = {
        valor: "500.35",
        data_registro: mockDataRegistro,
      };

      const response = await request(app.getHttpServer())
        .patch(
          `${apiGlobalPrefix}/investimentos/${investimentoMock.id}/linha-do-tempo/${linhaDoTempoId}`,
        )
        .send(updateDto)
        .expect(200);

      expect(response.body.valor).toBe(updateDto.valor);
      expect(response.body.data_registro).toBe(mockDataRegistro.toISOString());
    });

    it("should return 400 with correct messages when update a linha do tempo investimento when all fields as null", async () => {
      const mockDataRegistro = new Date();
      mockDataRegistro.setUTCHours(0, 0, 0, 0);

      const createDto: RegistroInvestimentoLinhaDoTempoCreateDto = {
        valor: faker.number
          .float({ min: 1, max: 50, fractionDigits: 2 })
          .toString(),
        data_registro: mockDataRegistro,
      };

      const createResponse = await request(app.getHttpServer())
        .post(
          `${apiGlobalPrefix}/investimentos/${investimentoMock.id}/linha-do-tempo`,
        )
        .send(createDto)
        .expect(201);

      const linhaDoTempoId = createResponse.body.id;

      const updateDto: Required<RegistroInvestimentoLinhaDoTempoUpdateDto> = {
        valor: null,
        data_registro: null,
        data_inatividade: null,
      };

      const response = await request(app.getHttpServer())
        .patch(
          `${apiGlobalPrefix}/investimentos/${investimentoMock.id}/linha-do-tempo/${linhaDoTempoId}`,
        )
        .send(updateDto)
        .expect(400);

      expect(response.body).toHaveProperty("message");
      expect(Array.isArray(response.body.message)).toBe(true);

      expect(response.body.message).toEqual([
        "valor should not be empty",
        "valor is not a valid decimal number.",
        "data_registro must be a Date instance",
      ]);
    });

    it("should return 400 with correct messages when update a linha do tempo investimento when all fields as wrong", async () => {
      const mockDataRegistro = new Date();
      mockDataRegistro.setUTCHours(0, 0, 0, 0);

      const createDto: RegistroInvestimentoLinhaDoTempoCreateDto = {
        valor: faker.number
          .float({ min: 1, max: 50, fractionDigits: 2 })
          .toString(),
        data_registro: mockDataRegistro,
      };

      const createResponse = await request(app.getHttpServer())
        .post(
          `${apiGlobalPrefix}/investimentos/${investimentoMock.id}/linha-do-tempo`,
        )
        .send(createDto)
        .expect(201);

      const linhaDoTempoId = createResponse.body.id;

      const updateDto: Required<RegistroInvestimentoLinhaDoTempoUpdateDto> = {
        valor: faker.string.alpha(5),
        data_registro: faker.number.int({
          min: 100,
          max: 999,
        }) as unknown as Date,
        data_inatividade: faker.number.int({
          min: 100,
          max: 999,
        }) as unknown as Date,
      };

      const response = await request(app.getHttpServer())
        .patch(
          `${apiGlobalPrefix}/investimentos/${investimentoMock.id}/linha-do-tempo/${linhaDoTempoId}`,
        )
        .send(updateDto)
        .expect(400);

      expect(response.body).toHaveProperty("message");
      expect(Array.isArray(response.body.message)).toBe(true);

      expect(response.body.message).toEqual([
        "valor is not a valid decimal number.",
      ]);
    });

    it("should return 200 when update valor", async () => {
      const mockDataRegistro = new Date();
      mockDataRegistro.setUTCHours(0, 0, 0, 0);

      const createDto: RegistroInvestimentoLinhaDoTempoCreateDto = {
        valor: faker.number
          .float({ min: 1, max: 50, fractionDigits: 2 })
          .toString(),
        data_registro: mockDataRegistro,
      };

      const createResponse = await request(app.getHttpServer())
        .post(
          `${apiGlobalPrefix}/investimentos/${investimentoMock.id}/linha-do-tempo`,
        )
        .send(createDto)
        .expect(201);

      const linhaDoTempoId = createResponse.body.id;

      const updateDto: RegistroInvestimentoLinhaDoTempoUpdateDto = {
        valor: faker.number
          .float({ min: 1, max: 50, fractionDigits: 2 })
          .toString(),
      };

      const response = await request(app.getHttpServer())
        .patch(
          `${apiGlobalPrefix}/investimentos/${investimentoMock.id}/linha-do-tempo/${linhaDoTempoId}`,
        )
        .send(updateDto)
        .expect(200);

      expect(response.body.valor).toBe(updateDto.valor);
    });

    it("should return a 404 error if the linha do tempo investimento exists but does not belong to the specified investimento", async () => {
      const mockDataRegistro = new Date();
      mockDataRegistro.setUTCHours(0, 0, 0, 0);

      const investimentoMock2: InvestimentoCreateDto = {
        nome: faker.string.alphanumeric(5),
        descricao: faker.string.alphanumeric(5),
        valor_inicial: faker.number
          .float({ min: 100, max: 999, fractionDigits: 2 })
          .toString(),
        categoria_id: categoriaMock.id,
      };

      const investimento2 = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/investimentos`)
        .send(investimentoMock2)
        .expect(201);

      const createDto: RegistroInvestimentoLinhaDoTempoCreateDto = {
        valor: faker.number
          .float({ min: 1, max: 50, fractionDigits: 2 })
          .toString(),
        data_registro: mockDataRegistro,
      };

      const createResponse = await request(app.getHttpServer())
        .post(
          `${apiGlobalPrefix}/investimentos/${investimentoMock.id}/linha-do-tempo`,
        )
        .send(createDto)
        .expect(201);

      const linhaDoTempoId = createResponse.body.id;

      const updateDto: RegistroInvestimentoLinhaDoTempoUpdateDto = {
        valor: "500.35",
        data_registro: mockDataRegistro,
      };

      await request(app.getHttpServer())
        .patch(
          `${apiGlobalPrefix}/investimentos/${investimento2.body.id}/linha-do-tempo/${linhaDoTempoId}`,
        )
        .send(updateDto)
        .expect(404);
    });

    it("should return 404 if linha do tempo investimento not found for update", async () => {
      const updateDto: RegistroInvestimentoLinhaDoTempoUpdateDto = {
        valor: "600.00",
      };

      await request(app.getHttpServer())
        .patch(
          `${apiGlobalPrefix}/investimentos/${investimentoMock.id}/linha-do-tempo/9999`,
        )
        .send(updateDto)
        .expect(404);
    });

    it("should return 404 if investimento was soft deleted", async () => {
      const mockDataRegistro = new Date();
      mockDataRegistro.setUTCHours(0, 0, 0, 0);

      const investimentoMock: InvestimentoCreateDto = {
        nome: faker.string.alphanumeric(5),
        descricao: faker.string.alphanumeric(5),
        valor_inicial: faker.number
          .float({ min: 100, max: 999, fractionDigits: 2 })
          .toString(),
        categoria_id: categoriaMock.id,
      };

      const investimento = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/investimentos`)
        .send(investimentoMock)
        .expect(201);

      const createDto: RegistroInvestimentoLinhaDoTempoCreateDto = {
        valor: faker.number
          .float({ min: 1, max: 50, fractionDigits: 2 })
          .toString(),
        data_registro: mockDataRegistro,
      };

      const createResponse = await request(app.getHttpServer())
        .post(
          `${apiGlobalPrefix}/investimentos/${investimento.body.id}/linha-do-tempo`,
        )
        .send(createDto)
        .expect(201);

      const linhaDoTempoId = createResponse.body.id;

      await request(app.getHttpServer())
        .delete(`${apiGlobalPrefix}/investimentos/${investimento.body.id}`)
        .expect(200);

      const updateDto: RegistroInvestimentoLinhaDoTempoUpdateDto = {
        valor: "600.00",
      };

      const response = await request(app.getHttpServer())
        .patch(
          `${apiGlobalPrefix}/investimentos/${investimento.body.id}/linha-do-tempo/${linhaDoTempoId}`,
        )
        .send(updateDto)
        .expect(404);

      expect(response.body.message).toBe(
        "O investimento informado não foi encontrado.",
      );
    });

    it("should return 404 if linha do tempo investimento was soft deleted", async () => {
      const mockDataRegistro = new Date();
      mockDataRegistro.setUTCHours(0, 0, 0, 0);

      const createDto: RegistroInvestimentoLinhaDoTempoCreateDto = {
        valor: faker.number
          .float({ min: 1, max: 50, fractionDigits: 2 })
          .toString(),
        data_registro: mockDataRegistro,
      };

      const createResponse = await request(app.getHttpServer())
        .post(
          `${apiGlobalPrefix}/investimentos/${investimentoMock.id}/linha-do-tempo`,
        )
        .send(createDto)
        .expect(201);

      const linhaDoTempoId = createResponse.body.id;

      await request(app.getHttpServer())
        .delete(
          `${apiGlobalPrefix}/investimentos/${investimentoMock.id}/linha-do-tempo/${createResponse.body.id}`,
        )
        .expect(200);

      const updateDto: RegistroInvestimentoLinhaDoTempoUpdateDto = {
        valor: "600.00",
      };

      await request(app.getHttpServer())
        .patch(
          `${apiGlobalPrefix}/investimentos/${investimentoMock.id}/linha-do-tempo/${linhaDoTempoId}`,
        )
        .send(updateDto)
        .expect(404);
    });
  });

  describe(`DELETE ${apiGlobalPrefix}/investimentos/:investimento_id/linha-do-tempo/:id`, () => {
    it("should soft delete a linha do tempo investimento", async () => {
      const mockDataRegistro = new Date();
      mockDataRegistro.setUTCHours(0, 0, 0, 0);

      const createDto: RegistroInvestimentoLinhaDoTempoCreateDto = {
        valor: faker.number
          .float({ min: 1, max: 50, fractionDigits: 2 })
          .toString(),
        data_registro: mockDataRegistro,
      };

      const createResponse = await request(app.getHttpServer())
        .post(
          `${apiGlobalPrefix}/investimentos/${investimentoMock.id}/linha-do-tempo`,
        )
        .send(createDto)
        .expect(201);

      const linhaDoTempoId = createResponse.body.id;

      const response = await request(app.getHttpServer())
        .delete(
          `${apiGlobalPrefix}/investimentos/${investimentoMock.id}/linha-do-tempo/${linhaDoTempoId}`,
        )
        .expect(200);

      expect(response.body.soft_delete).toBeTruthy();
    });

    it("should return 404 if linha do tempo not found for delete", async () => {
      await request(app.getHttpServer())
        .delete(
          `${apiGlobalPrefix}/investimentos/${investimentoMock.id}/linha-do-tempo/9999`,
        )
        .expect(404);
    });

    it("should return 404 if linha do tempo investimento was soft deleted", async () => {
      const mockDataRegistro = new Date();
      mockDataRegistro.setUTCHours(0, 0, 0, 0);

      const createDto: RegistroInvestimentoLinhaDoTempoCreateDto = {
        valor: faker.number
          .float({ min: 1, max: 50, fractionDigits: 2 })
          .toString(),
        data_registro: mockDataRegistro,
      };

      const createResponse = await request(app.getHttpServer())
        .post(
          `${apiGlobalPrefix}/investimentos/${investimentoMock.id}/linha-do-tempo`,
        )
        .send(createDto)
        .expect(201);

      const linhaDoTempoId = createResponse.body.id;

      await request(app.getHttpServer())
        .delete(
          `${apiGlobalPrefix}/investimentos/${investimentoMock.id}/linha-do-tempo/${linhaDoTempoId}`,
        )
        .expect(200);

      await request(app.getHttpServer())
        .delete(
          `${apiGlobalPrefix}/investimentos/${investimentoMock.id}/linha-do-tempo/${linhaDoTempoId}`,
        )
        .expect(404);
    });

    // aaa
    it("should return 404 if investimento was soft deleted", async () => {
      const mockDataRegistro = new Date();
      mockDataRegistro.setUTCHours(0, 0, 0, 0);

      const investimentoMock: InvestimentoCreateDto = {
        nome: faker.string.alphanumeric(5),
        descricao: faker.string.alphanumeric(5),
        valor_inicial: faker.number
          .float({ min: 100, max: 999, fractionDigits: 2 })
          .toString(),
        categoria_id: categoriaMock.id,
      };

      const investimento = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/investimentos`)
        .send(investimentoMock)
        .expect(201);

      const createDto: RegistroInvestimentoLinhaDoTempoCreateDto = {
        valor: faker.number
          .float({ min: 1, max: 50, fractionDigits: 2 })
          .toString(),
        data_registro: mockDataRegistro,
      };

      const createResponse = await request(app.getHttpServer())
        .post(
          `${apiGlobalPrefix}/investimentos/${investimento.body.id}/linha-do-tempo`,
        )
        .send(createDto)
        .expect(201);

      const linhaDoTempoId = createResponse.body.id;

      await request(app.getHttpServer())
        .delete(`${apiGlobalPrefix}/investimentos/${investimento.body.id}`)
        .expect(200);

      const response = await request(app.getHttpServer())
        .delete(
          `${apiGlobalPrefix}/investimentos/${investimento.body.id}/linha-do-tempo/${linhaDoTempoId}`,
        )
        .expect(404);

      expect(response.body.message).toBe(
        "O investimento informado não foi encontrado.",
      );
    });

    it("should return a 404 error if the linha do tempo investimento exists but does not belong to the specified investimento", async () => {
      const mockDataRegistro = new Date();
      mockDataRegistro.setUTCHours(0, 0, 0, 0);

      const investimentoMock2: InvestimentoCreateDto = {
        nome: faker.string.alphanumeric(5),
        descricao: faker.string.alphanumeric(5),
        valor_inicial: faker.number
          .float({ min: 100, max: 999, fractionDigits: 2 })
          .toString(),
        categoria_id: categoriaMock.id,
      };

      const investimento2 = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/investimentos`)
        .send(investimentoMock2)
        .expect(201);

      const createDto: RegistroInvestimentoLinhaDoTempoCreateDto = {
        valor: faker.number
          .float({ min: 1, max: 50, fractionDigits: 2 })
          .toString(),
        data_registro: mockDataRegistro,
      };

      const createResponse = await request(app.getHttpServer())
        .post(
          `${apiGlobalPrefix}/investimentos/${investimentoMock.id}/linha-do-tempo`,
        )
        .send(createDto)
        .expect(201);

      const linhaDoTempoId = createResponse.body.id;

      await request(app.getHttpServer())
        .delete(
          `${apiGlobalPrefix}/investimentos/${investimento2.body.id}/linha-do-tempo/${linhaDoTempoId}`,
        )
        .expect(404);
    });
  });
});

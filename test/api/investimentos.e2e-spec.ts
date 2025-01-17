import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { PrismaService } from "../../src/modules/prisma/prisma.service";
import { globalPipes } from "../../src/pipes/globalPipes";
import { globalFilters } from "../../src/filters/global-filters";
import { globalInterceptors } from "../../src/interceptors/globalInterceptors";
import { runPrismaMigrations } from "../utils/run-prisma-migrations";
import { faker } from "@faker-js/faker";
import { formatValue } from "../utils/format-value";
import { InvestimentosModule } from "../../src/modules/api/investimentos/investimentos.module";
import { InvestimentoCreateDto } from "../../src/modules/api/investimentos/dtos/InvestimentoCreate.dto";
import { InvestimentoUpdateDto } from "../../src/modules/api/investimentos/dtos/InvestimentoUpdate.dto";
import { RegistroInvestimentoLinhaDoTempoCreateDto } from "src/modules/api/linha-do-tempo-investimentos/dtos/RegistroInvestimentoLinhaDoTempoCreate.dto";
import { LinhaDoTempoInvestimentosModule } from "../../src/modules/api/linha-do-tempo-investimentos/linha-do-tempo-investimentos.module";

jest.setTimeout(10000); // 10 segundos

const apiGlobalPrefix = "/api/v1";

describe("InvestimentosController (v1) (E2E)", () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  beforeAll(async () => {
    await runPrismaMigrations();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [InvestimentosModule, LinhaDoTempoInvestimentosModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.setGlobalPrefix(apiGlobalPrefix);

    prismaService = moduleFixture.get<PrismaService>(PrismaService);

    globalPipes.forEach((gp) => app.useGlobalPipes(gp));
    globalFilters.forEach((gf) => app.useGlobalFilters(gf));
    globalInterceptors.forEach((gi) => app.useGlobalInterceptors(gi));

    await app.init();
  });

  afterAll(async () => {
    await prismaService.$disconnect();
    await app.close();
  });

  describe(`POST ${apiGlobalPrefix}/investimentos`, () => {
    it("should create a new investimento", async () => {
      const createInvestimentoDto: InvestimentoCreateDto = {
        nome: faker.string.alphanumeric(5),
        descricao: faker.string.alphanumeric(5),
        valor_inicial: formatValue(
          faker.number.float({ min: 1000, max: 9999, fractionDigits: 2 }),
        ),
        categoria_id: 1,
      };

      const response = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/investimentos`)
        .send(createInvestimentoDto)
        .expect(201);

      expect(response.body).toHaveProperty("id");
      expect(response.body.nome).toBe(createInvestimentoDto.nome);
      expect(response.body.valor_inicial).toBe(
        createInvestimentoDto.valor_inicial,
      );
      expect(response.body.valor_atual).toBe(
        createInvestimentoDto.valor_inicial,
      );
    });

    it("should return 400 with correct messages when create a new investimento when all fields as null", async () => {
      const createInvestimentoDto: Required<InvestimentoCreateDto> = {
        nome: null,
        descricao: null,
        valor_inicial: null,
        categoria_id: null,
      };

      const response = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/investimentos`)
        .send(createInvestimentoDto)
        .expect(400);

      expect(response.body).toHaveProperty("message");
      expect(Array.isArray(response.body.message)).toBe(true);

      expect(response.body.message).toEqual([
        "nome should not be empty",
        "nome must be a string",
        "descricao should not be empty",
        "descricao must be a string",
        "valor_inicial should not be empty",
        "valor_inicial is not a valid decimal number.",
        "categoria_id should not be empty",
        "categoria_id must be an integer number",
      ]);
    });

    it("should return 400 with correct messages when create a new investimento when all fields wrong", async () => {
      const createInvestimentoDto: Required<InvestimentoCreateDto> = {
        nome: faker.number.int({ min: 100, max: 999 }) as unknown as string,
        descricao: faker.number.int({
          min: 100,
          max: 999,
        }) as unknown as string,
        valor_inicial: faker.string.alpha(5),
        categoria_id: faker.string.alpha(5) as unknown as number,
      };

      const response = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/investimentos`)
        .send(createInvestimentoDto)
        .expect(400);

      expect(response.body).toHaveProperty("message");
      expect(Array.isArray(response.body.message)).toBe(true);

      expect(response.body.message).toEqual([
        "nome must be a string",
        "descricao must be a string",
        "valor_inicial is not a valid decimal number.",
        "categoria_id must be an integer number",
      ]);
    });

    it("should create investimento even if it has already been created and deleted (soft delete)", async () => {
      const nome = faker.string.alphanumeric(6).toUpperCase();
      const descricao = faker.string.alphanumeric(6).toUpperCase();
      const categoria_id = 1;
      const valor_inicial = faker.number
        .float({ min: 1000, max: 5000, fractionDigits: 2 })
        .toString();

      const investimento = await prismaService.investimento.create({
        data: {
          nome,
          descricao,
          valor_inicial,
          categoria_id,
          soft_delete: new Date(),
        },
      });

      const response = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/investimentos`)
        .send({ nome, descricao, valor_inicial, categoria_id })
        .expect(201);

      expect(response.body).toHaveProperty("id");
      expect(response.body.id).not.toBe(investimento.id);
      expect(response.body.nome).toBe(nome);
      expect(response.body.valor_inicial).toBe(valor_inicial);
      expect(response.body.descricao).toBe(descricao);
      expect(response.body.categoria_id).toBe(categoria_id);
    });

    it("should return 400 on pass an invalid field on create a new investimento", async () => {
      const createInvestimentoDto = {
        nome: faker.string.alphanumeric(5),
        descricao: faker.string.alphanumeric(5),
        valor_inicial: formatValue(
          faker.number.float({ min: 1000, max: 9999, fractionDigits: 2 }),
        ),
        categoria_id: 1,
        invalid_field: faker.string.alphanumeric(5),
      } as InvestimentoCreateDto;

      await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/investimentos`)
        .send(createInvestimentoDto)
        .expect(400);
    });
  });

  describe("GET ${apiGlobalPrefix}/investimentos", () => {
    it("should return all investimentos", async () => {
      const response = await request(app.getHttpServer())
        .get(`${apiGlobalPrefix}/investimentos`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it("should not return soft deleted investimentos", async () => {
      const investimento = await prismaService.investimento.create({
        data: {
          nome: faker.string.alphanumeric(5),
          descricao: faker.string.alphanumeric(5),
          valor_inicial: formatValue(
            faker.number.float({ min: 1000, max: 9999, fractionDigits: 2 }),
          ),
          categoria_id: 1,
          soft_delete: new Date(),
        },
      });

      const response = await request(app.getHttpServer()).get(
        `${apiGlobalPrefix}/investimentos`,
      );

      const result = response.body.filter((i) => i.id === investimento.id);

      expect(result.length).toBe(0);
    });
  });

  describe(`GET ${apiGlobalPrefix}/investimentos/:id`, () => {
    it("should return a single investimento", async () => {
      const createInvestimentoDto: InvestimentoCreateDto = {
        nome: faker.string.alphanumeric(5),
        descricao: faker.string.alphanumeric(5),
        valor_inicial: formatValue(
          faker.number.float({ min: 1000, max: 9999, fractionDigits: 2 }),
        ),
        categoria_id: 1,
      };

      const createResponse = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/investimentos`)
        .send(createInvestimentoDto)
        .expect(201);

      const investimentoId = createResponse.body.id;

      const response = await request(app.getHttpServer())
        .get(`${apiGlobalPrefix}/investimentos/${investimentoId}`)
        .expect(200);

      expect(response.body.id).toBe(investimentoId);
      expect(response.body.nome).toBe(createInvestimentoDto.nome);
      expect(response.body.descricao).toBe(createInvestimentoDto.descricao);
      expect(response.body.valor_inicial).toBe(
        createInvestimentoDto.valor_inicial,
      );
      expect(response.body.categoria_id).toBe(
        createInvestimentoDto.categoria_id,
      );
    });

    it("should return 404 if investimento not found", async () => {
      const response = await request(app.getHttpServer())
        .get(`${apiGlobalPrefix}/investimentos/9999`)
        .expect(404);

      expect(response.body.message).toBe("Not Found");
    });
  });

  describe(`PATCH ${apiGlobalPrefix}/investimentos/:id`, () => {
    it("should update an investimento without any linha do tempo inputs", async () => {
      const createInvestimentoDto: InvestimentoCreateDto = {
        nome: faker.string.alphanumeric(5),
        descricao: faker.string.alphanumeric(5),
        valor_inicial: formatValue(
          faker.number.float({ min: 100, max: 599, fractionDigits: 2 }),
        ),
        categoria_id: 1,
      };

      const createResponse = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/investimentos`)
        .send(createInvestimentoDto)
        .expect(201);

      const investimentoId = createResponse.body.id;

      const updateInvestimentoDto: InvestimentoUpdateDto = {
        nome: "Investimento C Atualizado",
        valor_inicial: "850.00",
      };

      const response = await request(app.getHttpServer())
        .patch(`${apiGlobalPrefix}/investimentos/${investimentoId}`)
        .send(updateInvestimentoDto)
        .expect(200);

      expect(response.body.nome).toBe(updateInvestimentoDto.nome);
      expect(response.body.valor_inicial).toBe("850");
    });

    // TODO criar aqui um teste que cadastra na linha do tempo e depois atualiza o valor_inicial e verifica
    // se o valor_atual é igual ao valor da linha do tempo

    it("should return 200 when inactivate an investimento", async () => {
      const createInvestimentoDto: InvestimentoCreateDto = {
        nome: faker.string.alphanumeric(5),
        descricao: faker.string.alphanumeric(5),
        valor_inicial: formatValue(
          faker.number.float({ min: 100, max: 599, fractionDigits: 2 }),
        ),
        categoria_id: 1,
      };

      const createResponse = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/investimentos`)
        .send(createInvestimentoDto)
        .expect(201);

      const investimentoId = createResponse.body.id;

      const updateInvestimentoDto: InvestimentoUpdateDto = {
        data_inatividade: new Date(),
      };

      const response = await request(app.getHttpServer())
        .patch(`${apiGlobalPrefix}/investimentos/${investimentoId}`)
        .send(updateInvestimentoDto)
        .expect(200);

      expect(response.body.data_inatividade).toBeTruthy();
    });

    it("should return 200 when activate an investimento", async () => {
      const createInvestimentoDto: InvestimentoCreateDto = {
        nome: faker.string.alphanumeric(5),
        descricao: faker.string.alphanumeric(5),
        valor_inicial: formatValue(
          faker.number.float({ min: 100, max: 599, fractionDigits: 2 }),
        ),
        categoria_id: 1,
      };

      const createResponse = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/investimentos`)
        .send(createInvestimentoDto)
        .expect(201);

      const investimentoId = createResponse.body.id;

      const updateInvestimentoDto: InvestimentoUpdateDto = {
        data_inatividade: null,
      };

      await request(app.getHttpServer())
        .patch(`${apiGlobalPrefix}/investimentos/${investimentoId}`)
        .send({ data_inatividade: new Date() })
        .expect(200);

      const response = await request(app.getHttpServer())
        .patch(`${apiGlobalPrefix}/investimentos/${investimentoId}`)
        .send(updateInvestimentoDto)
        .expect(200);

      expect(response.body.data_inatividade).toBeNull();
    });

    it("should return 400 with correct messages when update an investimento when all fields as null", async () => {
      const createInvestimentoDto: InvestimentoCreateDto = {
        nome: faker.string.alphanumeric(5),
        descricao: faker.string.alphanumeric(5),
        valor_inicial: formatValue(
          faker.number.float({ min: 100, max: 599, fractionDigits: 2 }),
        ),
        categoria_id: 1,
      };

      const createResponse = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/investimentos`)
        .send(createInvestimentoDto)
        .expect(201);

      const investimentoId = createResponse.body.id;

      const updateInvestimentoDto: Required<InvestimentoUpdateDto> = {
        nome: null,
        descricao: null,
        valor_inicial: null,
        categoria_id: null,
        data_inatividade: null,
      };

      const response = await request(app.getHttpServer())
        .patch(`${apiGlobalPrefix}/investimentos/${investimentoId}`)
        .send(updateInvestimentoDto)
        .expect(400);

      expect(response.body).toHaveProperty("message");
      expect(Array.isArray(response.body.message)).toBe(true);

      expect(response.body.message).toEqual([
        "nome should not be empty",
        "nome must be a string",
        "descricao should not be empty",
        "descricao must be a string",
        "valor_inicial should not be empty",
        "valor_inicial is not a valid decimal number.",
        "categoria_id should not be empty",
        "categoria_id must be an integer number",
      ]);
    });

    it("should return 400 with correct messages when update an investimento when all fields as wrong", async () => {
      const createInvestimentoDto: InvestimentoCreateDto = {
        nome: faker.string.alphanumeric(5),
        descricao: faker.string.alphanumeric(5),
        valor_inicial: formatValue(
          faker.number.float({ min: 100, max: 599, fractionDigits: 2 }),
        ),
        categoria_id: 1,
      };

      const createResponse = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/investimentos`)
        .send(createInvestimentoDto)
        .expect(201);

      const investimentoId = createResponse.body.id;

      const updateInvestimentoDto: Required<InvestimentoUpdateDto> = {
        nome: faker.number.int({ min: 100, max: 999 }) as unknown as string,
        descricao: faker.number.int({
          min: 100,
          max: 999,
        }) as unknown as string,
        valor_inicial: faker.string.alpha(5),
        data_inatividade: faker.string.alpha(5) as unknown as Date,
        categoria_id: faker.string.alphanumeric(5) as unknown as number,
      };

      const response = await request(app.getHttpServer())
        .patch(`${apiGlobalPrefix}/investimentos/${investimentoId}`)
        .send(updateInvestimentoDto)
        .expect(400);

      expect(response.body).toHaveProperty("message");
      expect(Array.isArray(response.body.message)).toBe(true);

      expect(response.body.message).toEqual([
        "nome must be a string",
        "descricao must be a string",
        "valor_inicial is not a valid decimal number.",
        "categoria_id must be an integer number",
        "data_inatividade must be a Date instance",
      ]);
    });

    it("should return 404 if try to update an investimento was deleted (soft delete)", async () => {
      const createInvestimentoDto: InvestimentoCreateDto = {
        nome: faker.string.alphanumeric(5),
        descricao: faker.string.alphanumeric(5),
        valor_inicial: formatValue(
          faker.number.float({ min: 100, max: 599, fractionDigits: 2 }),
        ),
        categoria_id: 1,
      };

      const createResponse = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/investimentos`)
        .send(createInvestimentoDto)
        .expect(201);

      const investimentoId = createResponse.body.id;

      await request(app.getHttpServer()).delete(
        `${apiGlobalPrefix}/investimentos/${investimentoId}`,
      );

      const updateInvestimentoDto: InvestimentoUpdateDto = {
        nome: "Investimento C Atualizado",
        valor_inicial: "850.00",
      };

      await request(app.getHttpServer())
        .patch(`${apiGlobalPrefix}/investimentos/${investimentoId}`)
        .send(updateInvestimentoDto)
        .expect(404);
    });
  });

  describe(`DELETE ${apiGlobalPrefix}/investimentos/:id`, () => {
    it("should delete an investimento (soft delete)", async () => {
      const createInvestimentoDto: InvestimentoCreateDto = {
        nome: faker.string.alphanumeric(5),
        descricao: faker.string.alphanumeric(5),
        valor_inicial: formatValue(
          faker.number.float({ min: 100, max: 599, fractionDigits: 2 }),
        ),
        categoria_id: 1,
      };

      const createResponse = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/investimentos`)
        .send(createInvestimentoDto)
        .expect(201);

      const investimentoId = createResponse.body.id;

      const response = await request(app.getHttpServer())
        .delete(`${apiGlobalPrefix}/investimentos/${investimentoId}`)
        .expect(200);

      expect(response.body.soft_delete).toBeTruthy();
    });

    it("should return 404 if investimento was deleted (soft delete)", async () => {
      const createInvestimentoDto: InvestimentoCreateDto = {
        nome: faker.string.alphanumeric(5),
        descricao: faker.string.alphanumeric(5),
        valor_inicial: formatValue(
          faker.number.float({ min: 100, max: 599, fractionDigits: 2 }),
        ),
        categoria_id: 1,
      };

      const createResponse = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/investimentos`)
        .send(createInvestimentoDto)
        .expect(201);

      const investimentoId = createResponse.body.id;

      await request(app.getHttpServer()).delete(
        `${apiGlobalPrefix}/investimentos/${investimentoId}`,
      );

      await request(app.getHttpServer())
        .delete(`${apiGlobalPrefix}/investimentos/${investimentoId}`)
        .expect(404);
    });
  });

  describe("Budget value calculations", () => {
    it("should correctly update valor_inicial and valor_atual when creating a new investimento linha do tempo", async () => {
      const createInvestimentoDto: InvestimentoCreateDto = {
        nome: faker.string.alphanumeric(5),
        descricao: faker.string.alphanumeric(5),
        valor_inicial: formatValue(
          faker.number.float({ min: 100, max: 599, fractionDigits: 2 }),
        ),
        categoria_id: 1,
      };

      const createInvestimentoResponse = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/investimentos`)
        .send(createInvestimentoDto)
        .expect(201);

      const investimentoId = createInvestimentoResponse.body.id;

      const linhaDoTempoDto: RegistroInvestimentoLinhaDoTempoCreateDto = {
        valor: formatValue(faker.number.float({ min: 100, max: 199, fractionDigits: 2 })),
        data_registro: new Date(),
      }

      await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/investimentos/${investimentoId}/linha-do-tempo`)
        .send(linhaDoTempoDto)
        .expect(201);

      const investimento = await request(app.getHttpServer())
        .get(`${apiGlobalPrefix}/investimentos/${investimentoId}`)
        .expect(200);

      const valor_inicial = createInvestimentoDto.valor_inicial;
      const valor_atual = linhaDoTempoDto.valor;

      expect(investimento.body.valor_inicial).toBe(valor_inicial);
      expect(investimento.body.valor_atual).toBe(valor_atual);
    });

    it("should correctly update valor_inicial and valor_atual when creating two new investimento linha do tempo", async () => {
      const createInvestimentoDto: InvestimentoCreateDto = {
        nome: faker.string.alphanumeric(5),
        descricao: faker.string.alphanumeric(5),
        valor_inicial: formatValue(
          faker.number.float({ min: 100, max: 599, fractionDigits: 2 }),
        ),
        categoria_id: 1,
      };

      const createInvestimentoResponse = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/investimentos`)
        .send(createInvestimentoDto)
        .expect(201);

      const investimentoId = createInvestimentoResponse.body.id;

      const linhaDoTempo1Dto: RegistroInvestimentoLinhaDoTempoCreateDto = {
        valor: formatValue(faker.number.float({ min: 100, max: 999, fractionDigits: 2 })),
        data_registro: new Date('2025-01-16T03:00:00.000Z'),
      }

      const linhaDoTempo2Dto: RegistroInvestimentoLinhaDoTempoCreateDto = {
        valor: formatValue(faker.number.float({ min: 1000, max: 9999, fractionDigits: 2 })),
        data_registro: new Date('2025-01-17T03:00:00.000Z'),
      }

      await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/investimentos/${investimentoId}/linha-do-tempo`)
        .send(linhaDoTempo1Dto)
        .expect(201);
      
      await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/investimentos/${investimentoId}/linha-do-tempo`)
        .send(linhaDoTempo2Dto)
        .expect(201);

      const investimento = await request(app.getHttpServer())
        .get(`${apiGlobalPrefix}/investimentos/${investimentoId}`)
        .expect(200);

      const valor_inicial = createInvestimentoDto.valor_inicial;
      const valor_atual = linhaDoTempo2Dto.valor;

      expect(investimento.body.valor_inicial).toBe(valor_inicial);
      expect(investimento.body.valor_atual).toBe(valor_atual);
    });

    it("should correctly update valor_inicial and valor_atual when creating two new investimento linha do tempo in same day", async () => {
      const createInvestimentoDto: InvestimentoCreateDto = {
        nome: faker.string.alphanumeric(5),
        descricao: faker.string.alphanumeric(5),
        valor_inicial: formatValue(
          faker.number.float({ min: 100, max: 599, fractionDigits: 2 }),
        ),
        categoria_id: 1,
      };

      const createInvestimentoResponse = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/investimentos`)
        .send(createInvestimentoDto)
        .expect(201);

      const investimentoId = createInvestimentoResponse.body.id;

      const linhaDoTempo1Dto: RegistroInvestimentoLinhaDoTempoCreateDto = {
        valor: formatValue(faker.number.float({ min: 100, max: 999, fractionDigits: 2 })),
        data_registro: new Date('2025-01-16T03:00:00.000Z'),
      }

      const linhaDoTempo2Dto: RegistroInvestimentoLinhaDoTempoCreateDto = {
        valor: formatValue(faker.number.float({ min: 1000, max: 9999, fractionDigits: 2 })),
        data_registro: new Date('2025-01-16T03:00:00.000Z'),
      }

      await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/investimentos/${investimentoId}/linha-do-tempo`)
        .send(linhaDoTempo1Dto)
        .expect(201);
      
      await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/investimentos/${investimentoId}/linha-do-tempo`)
        .send(linhaDoTempo2Dto)
        .expect(201);

      const investimento = await request(app.getHttpServer())
        .get(`${apiGlobalPrefix}/investimentos/${investimentoId}`)
        .expect(200);

      const valor_inicial = createInvestimentoDto.valor_inicial;
      const valor_atual = linhaDoTempo2Dto.valor;

      expect(investimento.body.valor_inicial).toBe(valor_inicial);
      expect(investimento.body.valor_atual).toBe(valor_atual);
    });

    it("should correctly update valor_inicial and valor_atual when creating a new investimento linha do tempo and update valor_inicial of investimento linha do tempo", async () => {
      const createInvestimentoDto: InvestimentoCreateDto = {
        nome: faker.string.alphanumeric(5),
        descricao: faker.string.alphanumeric(5),
        valor_inicial: formatValue(
          faker.number.float({ min: 100, max: 599, fractionDigits: 2 }),
        ),
        categoria_id: 1,
      };

      const createInvestimentoResponse = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/investimentos`)
        .send(createInvestimentoDto)
        .expect(201);

      const investimentoId = createInvestimentoResponse.body.id;

      const linhaDoTempoDto: RegistroInvestimentoLinhaDoTempoCreateDto = {
        valor: formatValue(faker.number.float({ min: 100, max: 999, fractionDigits: 2 })),
        data_registro: new Date('2025-01-16T03:00:00.000Z'),
      }

      await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/investimentos/${investimentoId}/linha-do-tempo`)
        .send(linhaDoTempoDto)
        .expect(201);

      const updateInvestimentoDto: InvestimentoUpdateDto = {
        valor_inicial: formatValue(faker.number.float( { min: 10, max: 99, fractionDigits: 2 }))
      }

      await request(app.getHttpServer())
        .patch(`${apiGlobalPrefix}/investimentos/${investimentoId}`)
        .send(updateInvestimentoDto)
        .expect(200);

      const investimento = await request(app.getHttpServer())
        .get(`${apiGlobalPrefix}/investimentos/${investimentoId}`)
        .expect(200);

      const valor_inicial = updateInvestimentoDto.valor_inicial;
      const valor_atual = linhaDoTempoDto.valor;

      expect(investimento.body.valor_inicial).toBe(valor_inicial);
      expect(investimento.body.valor_atual).toBe(valor_atual);
    });

    it("should correctly update valor_inicial and valor_atual when deleting a investimento linha do tempo", async () => {
      const createInvestimentoDto: InvestimentoCreateDto = {
        nome: faker.string.alphanumeric(5),
        descricao: faker.string.alphanumeric(5),
        valor_inicial: formatValue(
          faker.number.float({ min: 100, max: 599, fractionDigits: 2 }),
        ),
        categoria_id: 1,
      };

      const createInvestimentoResponse = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/investimentos`)
        .send(createInvestimentoDto)
        .expect(201);

      const investimentoId = createInvestimentoResponse.body.id;

      const linhaDoTempoDto: RegistroInvestimentoLinhaDoTempoCreateDto = {
        valor: formatValue(faker.number.float({ min: 100, max: 199, fractionDigits: 2 })),
        data_registro: new Date(),
      }

      const linhaDoTempo = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/investimentos/${investimentoId}/linha-do-tempo`)
        .send(linhaDoTempoDto)
        .expect(201);
      
      await request(app.getHttpServer())
        .delete(`${apiGlobalPrefix}/investimentos/${investimentoId}/linha-do-tempo/${linhaDoTempo.body.id}`)
        .expect(200);

      const investimento = await request(app.getHttpServer())
        .get(`${apiGlobalPrefix}/investimentos/${investimentoId}`)
        .expect(200);

      const valor_inicial = createInvestimentoDto.valor_inicial;
      const valor_atual = createInvestimentoDto.valor_inicial;

      expect(investimento.body.valor_inicial).toBe(valor_inicial);
      expect(investimento.body.valor_atual).toBe(valor_atual);
    });

    it("should correctly update valor_inicial and valor_atual when creating two linha do tempo investimento and deleting the latest investimento linha do tempo", async () => {
      const createInvestimentoDto: InvestimentoCreateDto = {
        nome: faker.string.alphanumeric(5),
        descricao: faker.string.alphanumeric(5),
        valor_inicial: formatValue(
          faker.number.float({ min: 100, max: 599, fractionDigits: 2 }),
        ),
        categoria_id: 1,
      };

      const createInvestimentoResponse = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/investimentos`)
        .send(createInvestimentoDto)
        .expect(201);

      const investimentoId = createInvestimentoResponse.body.id;

      const linhaDoTempo1Dto: RegistroInvestimentoLinhaDoTempoCreateDto = {
        valor: formatValue(faker.number.float({ min: 100, max: 999, fractionDigits: 2 })),
        data_registro: new Date('2025-01-15T03:00:00.000Z'),
      }

      const linhaDoTempo2Dto: RegistroInvestimentoLinhaDoTempoCreateDto = {
        valor: formatValue(faker.number.float({ min: 1000, max: 9999, fractionDigits: 2 })),
        data_registro: new Date('2025-01-16T03:00:00.000Z'),
      }

      await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/investimentos/${investimentoId}/linha-do-tempo`)
        .send(linhaDoTempo1Dto)
        .expect(201);
      
      const responseLinhaDoTempo2 = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/investimentos/${investimentoId}/linha-do-tempo`)
        .send(linhaDoTempo2Dto)
        .expect(201);

      await request(app.getHttpServer())
        .delete(`${apiGlobalPrefix}/investimentos/${investimentoId}/linha-do-tempo/${responseLinhaDoTempo2.body.id}`)
        .expect(200);

      const investimento = await request(app.getHttpServer())
        .get(`${apiGlobalPrefix}/investimentos/${investimentoId}`)
        .expect(200);

      const valor_inicial = createInvestimentoDto.valor_inicial;
      const valor_atual = linhaDoTempo1Dto.valor;

      expect(investimento.body.valor_inicial).toBe(valor_inicial);
      expect(investimento.body.valor_atual).toBe(valor_atual);
    });

    it("should correctly update valor_inicial and valor_atual when creating a new investimento linha do tempo and update valor_inicial after", async () => {
      const createInvestimentoDto: InvestimentoCreateDto = {
        nome: faker.string.alphanumeric(5),
        descricao: faker.string.alphanumeric(5),
        valor_inicial: formatValue(
          faker.number.float({ min: 100, max: 599, fractionDigits: 2 }),
        ),
        categoria_id: 1,
      };

      const createInvestimentoResponse = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/investimentos`)
        .send(createInvestimentoDto)
        .expect(201);

      const investimentoId = createInvestimentoResponse.body.id;

      const linhaDoTempoDto: RegistroInvestimentoLinhaDoTempoCreateDto = {
        valor: formatValue(faker.number.float({ min: 100, max: 199, fractionDigits: 2 })),
        data_registro: new Date(),
      }

      await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/investimentos/${investimentoId}/linha-do-tempo`)
        .send(linhaDoTempoDto)
        .expect(201);

      const new_valor_inicial = '665.45';
      await request(app.getHttpServer())
        .patch(`${apiGlobalPrefix}/investimentos/${investimentoId}`)
        .send({ valor_inicial: new_valor_inicial })
        .expect(200);

      const investimento = await request(app.getHttpServer())
        .get(`${apiGlobalPrefix}/investimentos/${investimentoId}`)
        .expect(200);

      const valor_inicial = new_valor_inicial;
      const valor_atual = linhaDoTempoDto.valor;

      expect(investimento.body.valor_inicial).toBe(valor_inicial);
      expect(investimento.body.valor_atual).toBe(valor_atual);
    });

    it("should correctly update valor_inicial and valor_atual when update valor_inicial in an investimento without investimento linha do tempo", async () => {
      const createInvestimentoDto: InvestimentoCreateDto = {
        nome: faker.string.alphanumeric(5),
        descricao: faker.string.alphanumeric(5),
        valor_inicial: formatValue(
          faker.number.float({ min: 100, max: 599, fractionDigits: 2 }),
        ),
        categoria_id: 1,
      };

      const createResponse = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/investimentos`)
        .send(createInvestimentoDto)
        .expect(201);

      const investimentoId = createResponse.body.id;

      const updateInvestimentoDto: InvestimentoUpdateDto = {
        valor_inicial: formatValue(faker.number.float({ min: 10, max: 99, fractionDigits: 2 })),
      };

      const response = await request(app.getHttpServer())
        .patch(`${apiGlobalPrefix}/investimentos/${investimentoId}`)
        .send(updateInvestimentoDto)
        .expect(200);

      expect(response.body.valor_inicial).toBe(updateInvestimentoDto.valor_inicial);
      expect(response.body.valor_atual).toBe(updateInvestimentoDto.valor_inicial);
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { PrismaService } from '../../src/modules/prisma/prisma.service';
import { globalPipes } from '../../src/pipes/globalPipes';
import { globalFilters } from '../../src/filters/global-filters';
import { globalInterceptors } from '../../src/interceptors/globalInterceptors';
import { runPrismaMigrations } from '../utils/run-prisma-migrations';
import { faker } from '@faker-js/faker';
import { CategoriaGasto, Orcamento } from '@prisma/client';
import { OrcamentoCreateInputDto } from '../../src/modules/api/orcamentos/dtos/OrcamentoCreateInput.dto';
import { OrcamentosModule } from '../../src/modules/api/orcamentos/orcamentos.module';
import { GastosVariadosModule } from '../../src/modules/api/gastos-variados/gastos-variados.module';
import { GastoVariadoCreateInputDto } from '../../src/modules/api/gastos-variados/dtos/GastoVariadoCreateInput.dto';
import { GastoVariadoUpdateInputDto } from '../../src/modules/api/gastos-variados/dtos/GastoVariadoUpdateInput.dto';

const apiGlobalPrefix = '/api/v1';

describe('GastosVariadosController (v1) (E2E)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  let categoriaMock: CategoriaGasto;
  let orcamentoMock: Orcamento;

  beforeAll(async () => {
    await runPrismaMigrations();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [OrcamentosModule, GastosVariadosModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.setGlobalPrefix(apiGlobalPrefix);

    prismaService = moduleFixture.get<PrismaService>(PrismaService);

    globalPipes.forEach(gp => app.useGlobalPipes(gp));
    globalFilters.forEach(gf => app.useGlobalFilters(gf));
    globalInterceptors.forEach(gi => app.useGlobalInterceptors(gi));

    await app.init();

    orcamentoMock = await prismaService.orcamento.create({
        data: {
            nome: faker.string.alphanumeric(5),
            valor_inicial: faker.number.float({ min: 1000, max: 10000, fractionDigits: 2 }).toString(),
        }
    });

    categoriaMock = await prismaService.categoriaGasto.create({
        data: {
            nome: faker.string.alphanumeric(5),
        }
    });
  });

  afterAll(async () => {
    await prismaService.$disconnect();
    await app.close();
  });

  describe(`POST ${apiGlobalPrefix}/gastos-variados`, () => {
    it('should create a new gasto variado', async () => {
      const mockDataPgto = new Date();
      mockDataPgto.setUTCHours(0, 0, 0, 0);

      const createGastoDto: GastoVariadoCreateInputDto = {
        descricao: faker.string.alphanumeric(5),
        valor: faker.number.float({ min: 1, max: 50, fractionDigits: 2 }).toString(),
        data_pgto: mockDataPgto,
        categoria_id: categoriaMock.id,
      };

      const response = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/orcamentos/${orcamentoMock.id}/gastos-variados`)
        .send(createGastoDto)
        .expect(201);

        expect(response.body).toHaveProperty('id');
        expect(response.body.descricao).toBe(createGastoDto.descricao);
        expect(response.body.valor).toBe(createGastoDto.valor);
        expect(response.body.data_pgto).toBe(mockDataPgto.toISOString());
        expect(response.body.categoria_id).toBe(createGastoDto.categoria_id);
        expect(response.body.orcamento_id).toBe(orcamentoMock.id);
    });

    it('should return 400 if data_pgto is passed as null', async () => {
      const createGastoDto: GastoVariadoCreateInputDto = {
        descricao: faker.string.alphanumeric(5),
        valor: faker.number.float({ min: 1, max: 50, fractionDigits: 2 }).toString(),
        data_pgto: null,
        categoria_id: categoriaMock.id,
      };

      const response = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/orcamentos/${orcamentoMock.id}/gastos-variados`)
        .send(createGastoDto)
        .expect(400);

        expect(response.body.message).toEqual(['data_pgto must be a Date instance']);
    });

    it('should return 404 when categoria gasto does not exists', async () => {
      const mockDataPgto = new Date();
      mockDataPgto.setUTCHours(0, 0, 0, 0);

      const createGastoDto: GastoVariadoCreateInputDto = {
        descricao: faker.string.alphanumeric(5),
        valor: faker.number.float({ min: 1, max: 50, fractionDigits: 2 }).toString(),
        data_pgto: mockDataPgto,
        categoria_id: 999,
      };

      const response = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/orcamentos/${orcamentoMock.id}/gastos-variados`)
        .send(createGastoDto)
        .expect(404);

        expect(response.body.message).toBe("A categoria informada não foi encontrada.");
    });

    it('should return 404 when orcamento does not exists', async () => {
      const mockDataPgto = new Date();
      mockDataPgto.setUTCHours(0, 0, 0, 0);

      const createGastoDto: GastoVariadoCreateInputDto = {
        descricao: faker.string.alphanumeric(5),
        valor: faker.number.float({ min: 1, max: 50, fractionDigits: 2 }).toString(),
        data_pgto: mockDataPgto,
        categoria_id: categoriaMock.id,
      };

      const response = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/orcamentos/999/gastos-variados`)
        .send(createGastoDto)
        .expect(404);

        expect(response.body.message).toBe("O orçamento informado não foi encontrado.");
    });

    it('should return 400 on passing an invalid field on create a new gasto variado', async () => {
      const mockDataPgto = new Date();
      mockDataPgto.setUTCHours(0, 0, 0, 0);

        const createGastoDto = {
            descricao: faker.string.alphanumeric(5),
            valor: faker.number.float({ min: 1, max: 50, fractionDigits: 2 }).toString(),
            data_pgto: mockDataPgto,
            categoria_id: categoriaMock.id,
            invalid_field: 'invalid'
        } as GastoVariadoCreateInputDto;
    

      await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/orcamentos/${orcamentoMock.id}/gastos-variados`)
        .send(createGastoDto)
        .expect(400);
    });
  });

  describe(`GET ${apiGlobalPrefix}/gastos-variados`, () => {
    it('should return all gastos variados', async () => {
      const mockDataPgto = new Date();
      mockDataPgto.setUTCHours(0, 0, 0, 0);

      const orcamentoMock2: OrcamentoCreateInputDto = {
        nome: faker.string.alphanumeric(5),
        valor_inicial: faker.number.float({ min: 100, max: 999, fractionDigits: 2 }).toString(),
      }

      const orcamento2 = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/orcamentos`)
        .send(orcamentoMock2)
        .expect(201);

      const gastoVariadoOrcamento2: GastoVariadoCreateInputDto = {
        categoria_id: categoriaMock.id,
        descricao: faker.string.alphanumeric(5),
        valor: faker.number.float({ min: 100, max: 999, fractionDigits: 2 }).toString(),
        data_pgto: mockDataPgto,
        observacoes: faker.string.alphanumeric(5),
      }

      await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/orcamentos/${orcamentoMock2}/gastos-variados`)
        .send(gastoVariadoOrcamento2)
        .expect(201);

      const responseOrcamentoMock = await request(app.getHttpServer())
        .get(`${apiGlobalPrefix}/orcamentos/${orcamentoMock.id}/gastos-variados`)
        .expect(200);

        const responseOrcamentoMock2 = await request(app.getHttpServer())
        .get(`${apiGlobalPrefix}/orcamentos/${orcamento2.body.id}/gastos-variados`)
        .expect(200);

      const orcamento1Ok = responseOrcamentoMock.body.every(reg => reg.orcamento_id === orcamentoMock.id);
      const orcamento2Ok = responseOrcamentoMock2.body.every(reg => reg.orcamento_id === orcamento2.body.id);

      expect(orcamento1Ok).toBeTruthy();
      expect(orcamento2Ok).toBeTruthy();
    });
  });

  describe(`GET ${apiGlobalPrefix}/gastos-variados/:id`, () => {
    it('should return a single gasto variado', async () => {
      const mockDataPgto = new Date();
      mockDataPgto.setUTCHours(0, 0, 0, 0);

        const createGastoDto: GastoVariadoCreateInputDto = {
            descricao: faker.string.alphanumeric(5),
            valor: faker.number.float({ min: 1, max: 50, fractionDigits: 2 }).toString(),
            data_pgto: mockDataPgto,
            categoria_id: categoriaMock.id,
        };

      const createResponse = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/orcamentos/${orcamentoMock.id}/gastos-variados`)
        .send(createGastoDto)
        .expect(201);

      const gastoId = createResponse.body.id;

      const response = await request(app.getHttpServer())
        .get(`${apiGlobalPrefix}/orcamentos/${orcamentoMock.id}/gastos-variados/${gastoId}`)
        .expect(200);

      expect(response.body.id).toBe(gastoId);
      expect(response.body.descricao).toBe(createGastoDto.descricao);
      expect(response.body.valor).toBe(createGastoDto.valor);
      expect(response.body.data_pgto).toBe(mockDataPgto.toISOString());
      expect(response.body.categoria_id).toBe(createGastoDto.categoria_id);
      expect(response.body.orcamento_id).toBe(orcamentoMock.id);
    });

    it('should return a 404 error if the gasto variado exists but does not belong to the specified orcamento', async () => {
      const mockDataPgto = new Date();
      mockDataPgto.setUTCHours(0, 0, 0, 0);

      const orcamentoMock2: OrcamentoCreateInputDto = {
        nome: faker.string.alphanumeric(5),
        valor_inicial: faker.number.float({ min: 100, max: 999, fractionDigits: 2 }).toString(),
      }

      const orcamento2 = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/orcamentos`)
        .send(orcamentoMock2)
        .expect(201);
      
      const createGastoDto: GastoVariadoCreateInputDto = {
          descricao: faker.string.alphanumeric(5),
          valor: faker.number.float({ min: 1, max: 50, fractionDigits: 2 }).toString(),
          data_pgto: mockDataPgto,
          categoria_id: categoriaMock.id,
      };

    const createResponse = await request(app.getHttpServer())
      .post(`${apiGlobalPrefix}/orcamentos/${orcamentoMock.id}/gastos-variados`)
      .send(createGastoDto)
      .expect(201);

    const gastoId = createResponse.body.id;

    await request(app.getHttpServer())
      .get(`${apiGlobalPrefix}/orcamentos/${orcamento2.body.id}/gastos-variados/${gastoId}`)
      .expect(404);    
  });

    it('should return 404 if gasto variado not found', async () => {
      const response = await request(app.getHttpServer())
        .get(`${apiGlobalPrefix}/orcamentos/${orcamentoMock.id}/gastos-variados/9999`)
        .expect(404);

      expect(response.body.message).toBe('Not Found');
    });
  });

  describe(`PATCH ${apiGlobalPrefix}/gastos-variados/:id`, () => {
    it('should update an existing gasto variado', async () => {
      const mockDataPgto = new Date();
      mockDataPgto.setUTCHours(0, 0, 0, 0);

        const createGastoDto: GastoVariadoCreateInputDto = {
            descricao: 'Descrição antiga',
            valor: faker.number.float({ min: 1, max: 50, fractionDigits: 2 }).toString(),
            data_pgto: mockDataPgto,
            categoria_id: categoriaMock.id,
        };

      const createResponse = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/orcamentos/${orcamentoMock.id}/gastos-variados`)
        .send(createGastoDto)
        .expect(201);

      const gastoId = createResponse.body.id;

      const updateGastoDto: GastoVariadoUpdateInputDto = {
        descricao: 'Gasto Variado D Atualizado',
        valor: '500.35',
        data_pgto: mockDataPgto
      };

      const response = await request(app.getHttpServer())
        .patch(`${apiGlobalPrefix}/orcamentos/${orcamentoMock.id}/gastos-variados/${gastoId}`)
        .send(updateGastoDto)
        .expect(200);

      expect(response.body.descricao).toBe(updateGastoDto.descricao);
      expect(response.body.valor).toBe(updateGastoDto.valor);
      expect(response.body.data_pgto).toBe(mockDataPgto.toISOString());
    });

    it('should return a 404 error if the gasto variado exists but does not belong to the specified orcamento', async () => {
      const mockDataPgto = new Date();
      mockDataPgto.setUTCHours(0, 0, 0, 0);

      const orcamentoMock2: OrcamentoCreateInputDto = {
        nome: faker.string.alphanumeric(5),
        valor_inicial: faker.number.float({ min: 100, max: 999, fractionDigits: 2 }).toString(),
      }

      const orcamento2 = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/orcamentos`)
        .send(orcamentoMock2)
        .expect(201);
      
      const createGastoDto: GastoVariadoCreateInputDto = {
          descricao: 'Descrição antiga',
          valor: faker.number.float({ min: 1, max: 50, fractionDigits: 2 }).toString(),
          data_pgto: mockDataPgto,
          categoria_id: categoriaMock.id,
      };

      const createResponse = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/orcamentos/${orcamentoMock.id}/gastos-variados`)
        .send(createGastoDto)
        .expect(201);

      const gastoId = createResponse.body.id;

      const updateGastoDto: GastoVariadoUpdateInputDto = {
        descricao: 'Gasto Variado D Atualizado',
        valor: '500.35',
        data_pgto: mockDataPgto
      };

      await request(app.getHttpServer())
        .patch(`${apiGlobalPrefix}/orcamentos/${orcamento2.body.id}/gastos-variados/${gastoId}`)
        .send(updateGastoDto)
        .expect(404);
    });

    it('should return 409 if add valor with a null data_pgto', async () => {
      const mockDataPgto = new Date();
      mockDataPgto.setUTCHours(0, 0, 0, 0);

      const createGastoDto: GastoVariadoCreateInputDto = {
          descricao: 'Descrição antiga',
          valor: faker.number.float({ min: 1, max: 50, fractionDigits: 2 }).toString(),
          data_pgto: mockDataPgto,
          categoria_id: categoriaMock.id,
      };

    const createResponse = await request(app.getHttpServer())
      .post(`${apiGlobalPrefix}/orcamentos/${orcamentoMock.id}/gastos-variados`)
      .send(createGastoDto)
      .expect(201);

    const gastoId = createResponse.body.id;

    const updateGastoDto: GastoVariadoUpdateInputDto = {
      descricao: 'Gasto Variado D Atualizado',
      valor: '500.35',
      data_pgto: null,
    };

    const response = await request(app.getHttpServer())
      .patch(`${apiGlobalPrefix}/orcamentos/${orcamentoMock.id}/gastos-variados/${gastoId}`)
      .send(updateGastoDto)
      .expect(409);

    expect(response.body.message).toBe("Se o valor for preenchido, a data_pgto também deve ser preenchida.");
  });

    it('should return 404 if gasto variado not found for update', async () => {
      const updateGastoDto: GastoVariadoUpdateInputDto = {
        descricao: 'Gasto Variado E Atualizado',
        valor: '600.00',
      };

      await request(app.getHttpServer())
        .patch(`${apiGlobalPrefix}/orcamentos/${orcamentoMock.id}/gastos-variados/9999`)
        .send(updateGastoDto)
        .expect(404);
    });
  });

  describe(`DELETE ${apiGlobalPrefix}/gastos-variados/:id`, () => {
    it('should soft delete a gasto variado', async () => {
      const mockDataPgto = new Date();
      mockDataPgto.setUTCHours(0, 0, 0, 0);

        const createGastoDto: GastoVariadoCreateInputDto = {
            descricao: faker.string.alphanumeric(5),
            valor: faker.number.float({ min: 1, max: 50, fractionDigits: 2 }).toString(),
            data_pgto: mockDataPgto,
            categoria_id: categoriaMock.id,
        };

      const createResponse = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/orcamentos/${orcamentoMock.id}/gastos-variados`)
        .send(createGastoDto)
        .expect(201);

      const gastoId = createResponse.body.id;

      const response = await request(app.getHttpServer())
        .delete(`${apiGlobalPrefix}/orcamentos/${orcamentoMock.id}/gastos-variados/${gastoId}`)
        .expect(200);

      expect(response.body.soft_delete).toBeTruthy();
    });

    it('should return 404 if gasto variado not found for delete', async () => {
      await request(app.getHttpServer())
        .delete(`${apiGlobalPrefix}/orcamentos/${orcamentoMock.id}/gastos-variados/9999`)
        .expect(404);
    });

    it('should return a 404 error if the gasto variado exists but does not belong to the specified orcamento', async () => {
      const mockDataPgto = new Date();
      mockDataPgto.setUTCHours(0, 0, 0, 0);

      const orcamentoMock2: OrcamentoCreateInputDto = {
        nome: faker.string.alphanumeric(5),
        valor_inicial: faker.number.float({ min: 100, max: 999, fractionDigits: 2 }).toString(),
      }

      const orcamento2 = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/orcamentos`)
        .send(orcamentoMock2)
        .expect(201);
      
      const createGastoDto: GastoVariadoCreateInputDto = {
          descricao: faker.string.alphanumeric(5),
          valor: faker.number.float({ min: 1, max: 50, fractionDigits: 2 }).toString(),
          data_pgto: mockDataPgto,
          categoria_id: categoriaMock.id,
      };

    const createResponse = await request(app.getHttpServer())
      .post(`${apiGlobalPrefix}/orcamentos/${orcamentoMock.id}/gastos-variados`)
      .send(createGastoDto)
      .expect(201);

    const gastoId = createResponse.body.id;

    await request(app.getHttpServer())
      .delete(`${apiGlobalPrefix}/orcamentos/${orcamento2.body.id}/gastos-variados/${gastoId}`)
      .expect(404);
  });
  });
});

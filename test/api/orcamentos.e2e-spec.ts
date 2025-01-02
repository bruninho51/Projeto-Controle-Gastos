import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { PrismaService } from '../../src/modules/prisma/prisma.service';
import { OrcamentosModule } from '../../src/modules/api/orcamentos/orcamentos.module';
import { OrcamentoCreateInputDto } from '../../src/modules/api/orcamentos/dtos/OrcamentoCreateInput.dto';
import { globalPipes } from '../../src/pipes/globalPipes';
import { globalFilters } from '../../src/filters/global-filters';
import { globalInterceptors } from '../../src/interceptors/globalInterceptors';
import { runPrismaMigrations } from '../utils/run-prisma-migrations';
import { faker } from '@faker-js/faker';

describe('OrcamentoController (v1) (E2E)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  beforeAll(async () => {
    await runPrismaMigrations();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [OrcamentosModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prismaService = moduleFixture.get<PrismaService>(PrismaService);

    globalPipes.forEach(gp => app.useGlobalPipes(gp));
    globalFilters.forEach(gf => app.useGlobalFilters(gf));
    globalInterceptors.forEach(gi => app.useGlobalInterceptors(gi));

    await app.init();
  });

  afterAll(async () => {
    await prismaService.$disconnect();
    await app.close();
  });

  describe('POST /v1/orcamentos', () => {
    it('should create a new orcamento', async () => {
      const createOrcamentoDto = {
        nome: 'Orçamento A',
        valor_inicial: '1000.45',
      };

      const response = await request(app.getHttpServer())
        .post('/v1/orcamentos')
        .send(createOrcamentoDto)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.nome).toBe(createOrcamentoDto.nome);
      expect(response.body.valor_inicial).toBe(createOrcamentoDto.valor_inicial);
      expect(response.body.valor_atual).toBe(createOrcamentoDto.valor_inicial);
      expect(response.body.valor_livre).toBe(createOrcamentoDto.valor_inicial);
    });

    it('should create orcamento even if it has already been created and deleted (soft delete)', async () => {
      const nome = faker.string.alphanumeric(6).toUpperCase();
      const valor_inicial = faker.number.float({ min: 1000, max: 5000, fractionDigits: 2 }).toString();

      const orcamento = await prismaService.orcamento.create({
        data: {
          nome,
          valor_inicial,
          soft_delete: new Date(),
        }
      });

      const response = await request(app.getHttpServer())
        .post('/v1/orcamentos')
        .send({ nome, valor_inicial })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.id).not.toBe(orcamento.id);
      expect(response.body.nome).toBe(nome);
      expect(response.body.valor_inicial).toBe(valor_inicial);
      expect(response.body.valor_atual).toBe(valor_inicial);
      expect(response.body.valor_livre).toBe(valor_inicial);
    });

    it('should return 400 on pass an invalid field on create a new orcamento', async () => {
      const createOrcamentoDto = {
        nome: 'Orçamento A',
        valor_inicial: '1000.45',
        valor_atual: '1030.32'
      } as OrcamentoCreateInputDto;
  
      await request(app.getHttpServer())
        .post('/v1/orcamentos')
        .send(createOrcamentoDto)
        .expect(400);
    });
  });

  describe('GET /v1/orcamentos', () => {
    it('should return all orcamentos', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/orcamentos')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should not return soft deleted orcamentos', async () => {
      const orcamento = await prismaService.orcamento.create({
        data: {
          nome: "Teste",
          valor_inicial: "3000",
          soft_delete: new Date(),
        }
      });

      const response = await request(app.getHttpServer())
        .get('/v1/orcamentos');

      const result = response.body.filter(o => o.id === orcamento.id);

      expect(result.length).toBe(0);
    });
  });

  describe('GET /v1/orcamentos/:id', () => {
    it('should return a single orcamento', async () => {
      const createOrcamentoDto = {
        nome: 'Orçamento B',
        valor_inicial: '500.20',
      };

      const createResponse = await request(app.getHttpServer())
        .post('/v1/orcamentos')
        .send(createOrcamentoDto)
        .expect(201);

      const orcamentoId = createResponse.body.id;

      const response = await request(app.getHttpServer())
        .get(`/v1/orcamentos/${orcamentoId}`)
        .expect(200);

      expect(response.body.id).toBe(orcamentoId);
      expect(response.body.nome).toBe(createOrcamentoDto.nome);
    });

    it('should return 404 if orcamento not found', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/orcamentos/9999')
        .expect(404);


      expect(response.body.message).toBe('Not Found');
    });
  });

  describe('PATCH /v1/orcamentos/:id', () => {
    it('should update an orcamento', async () => {
      const createOrcamentoDto = {
        nome: 'Orçamento C',
        valor_inicial: '700.10',
      };

      const createResponse = await request(app.getHttpServer())
        .post('/v1/orcamentos')
        .send(createOrcamentoDto)
        .expect(201);

      const orcamentoId = createResponse.body.id;

      const updateOrcamentoDto = {
        nome: 'Orçamento C Atualizado',
        valor_inicial: '850.00',
      };

      const response = await request(app.getHttpServer())
        .patch(`/v1/orcamentos/${orcamentoId}`)
        .send(updateOrcamentoDto)
        .expect(200);

      expect(response.body.nome).toBe(updateOrcamentoDto.nome);
      expect(response.body.valor_inicial).toBe('850');

      expect(response.body.valor_atual).toBe('850');
      expect(response.body.valor_livre).toBe('850');
    });

    it('should return 404 if try to update an orcamento was deleted (soft delete)', async () => {
      const createOrcamentoDto = {
        nome: 'Orçamento C',
        valor_inicial: '700.10',
      };

      const createResponse = await request(app.getHttpServer())
        .post('/v1/orcamentos')
        .send(createOrcamentoDto)
        .expect(201);

      const orcamentoId = createResponse.body.id;

      await request(app.getHttpServer())
        .delete(`/v1/orcamentos/${orcamentoId}`);

      const updateOrcamentoDto = {
        nome: 'Orçamento C Atualizado',
        valor_inicial: '850.00',
      };

      await request(app.getHttpServer())
        .patch(`/v1/orcamentos/${orcamentoId}`)
        .send(updateOrcamentoDto)
        .expect(404);

    });
  });

  describe('DELETE /v1/orcamentos/:id', () => {
    it('should delete an orcamento (soft delete)', async () => {
      const createOrcamentoDto = {
        nome: 'Orçamento D',
        valor_inicial: '900.00'
      };

      const createResponse = await request(app.getHttpServer())
        .post('/v1/orcamentos')
        .send(createOrcamentoDto)
        .expect(201);

      const orcamentoId = createResponse.body.id;

      const response = await request(app.getHttpServer())
        .delete(`/v1/orcamentos/${orcamentoId}`)
        .expect(200);

      expect(response.body.soft_delete).toBeTruthy();
    });

    it('should return 404 if orcamento was deleted (soft delete)', async () => {
      const createOrcamentoDto = {
        nome: 'Orçamento D',
        valor_inicial: '900.00'
      };

      const createResponse = await request(app.getHttpServer())
        .post('/v1/orcamentos')
        .send(createOrcamentoDto)
        .expect(201);

      const orcamentoId = createResponse.body.id;

      await request(app.getHttpServer())
          .delete(`/v1/orcamentos/${orcamentoId}`);


        await request(app.getHttpServer())
          .delete(`/v1/orcamentos/${orcamentoId}`)
          .expect(404);

    });
  });
});

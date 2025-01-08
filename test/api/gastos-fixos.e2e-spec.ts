import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { PrismaService } from '../../src/modules/prisma/prisma.service';
import { GastosFixosModule } from '../../src/modules/api/gastos-fixos/gastos-fixos.module';
import { GastoFixoCreateInputDto } from '../../src/modules/api/gastos-fixos/dtos/GastoFixoCreateInput.dto';
import { GastoFixoUpdateInputDto } from '../../src/modules/api/gastos-fixos/dtos/GastoFixoUpdateInput.dto';
import { globalPipes } from '../../src/pipes/globalPipes';
import { globalFilters } from '../../src/filters/global-filters';
import { globalInterceptors } from '../../src/interceptors/globalInterceptors';
import { runPrismaMigrations } from '../utils/run-prisma-migrations';
import { faker } from '@faker-js/faker';
import { CategoriaGasto, Orcamento } from '@prisma/client';

const apiGlobalPrefix = '/api/v1';

describe('GastosFixosController (v1) (E2E)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  let categoriaMock: CategoriaGasto;
  let orcamentoMock: Orcamento;

  beforeAll(async () => {
    await runPrismaMigrations();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [GastosFixosModule],
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

  describe(`POST ${apiGlobalPrefix}/gastos-fixos`, () => {
    it('should create a new gasto fixo', async () => {
      const createGastoDto: GastoFixoCreateInputDto = {
        descricao: faker.string.alphanumeric(5),
        previsto: faker.number.float({ min: 1, max: 50, fractionDigits: 2 }).toString(),
        categoria_id: categoriaMock.id,
        orcamento_id: orcamentoMock.id,
      };

      const response = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/gastos-fixos`)
        .send(createGastoDto)
        .expect(201);

        expect(response.body).toHaveProperty('id');
        expect(response.body.descricao).toBe(createGastoDto.descricao);
        expect(response.body.previsto).toBe(createGastoDto.previsto);
        expect(response.body.categoria_id).toBe(createGastoDto.categoria_id);
        expect(response.body.orcamento_id).toBe(createGastoDto.orcamento_id);
        
    });

    it('should return 409 when categoria gasto does not exists', async () => {
      const createGastoDto: GastoFixoCreateInputDto = {
        descricao: faker.string.alphanumeric(5),
        previsto: faker.number.float({ min: 1, max: 50, fractionDigits: 2 }).toString(),
        categoria_id: 999,
        orcamento_id: orcamentoMock.id,
      };

      const response = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/gastos-fixos`)
        .send(createGastoDto)
        .expect(404);

        expect(response.body.message).toBe("A categoria informada não foi encontrada.");
    });

    it('should return 409 when orcamento does not exists', async () => {
      const createGastoDto: GastoFixoCreateInputDto = {
        descricao: faker.string.alphanumeric(5),
        previsto: faker.number.float({ min: 1, max: 50, fractionDigits: 2 }).toString(),
        categoria_id: categoriaMock.id,
        orcamento_id: 999,
      };

      const response = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/gastos-fixos`)
        .send(createGastoDto)
        .expect(404);

        expect(response.body.message).toBe("O orçamento informado não foi encontrado.");
    });

    it('should return 400 on passing an invalid field on create a new gasto fixo', async () => {
        const createGastoDto = {
            descricao: faker.string.alphanumeric(5),
            previsto: faker.number.float({ min: 1, max: 50, fractionDigits: 2 }).toString(),
            categoria_id: categoriaMock.id,
            orcamento_id: orcamentoMock.id,
            invalid_field: 'invalid'
        } as GastoFixoCreateInputDto;
    

      await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/gastos-fixos`)
        .send(createGastoDto)
        .expect(400);
    });
  });

  describe(`GET ${apiGlobalPrefix}/gastos-fixos`, () => {
    it('should return all gastos fixos', async () => {
      const response = await request(app.getHttpServer())
        .get(`${apiGlobalPrefix}/gastos-fixos`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });
  });

  describe(`GET ${apiGlobalPrefix}/gastos-fixos/:id`, () => {
    it('should return a single gasto fixo', async () => {
        const createGastoDto: GastoFixoCreateInputDto = {
            descricao: faker.string.alphanumeric(5),
            previsto: faker.number.float({ min: 1, max: 50, fractionDigits: 2 }).toString(),
            categoria_id: categoriaMock.id,
            orcamento_id: orcamentoMock.id,
        };

      const createResponse = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/gastos-fixos`)
        .send(createGastoDto)
        .expect(201);

      const gastoId = createResponse.body.id;

      const response = await request(app.getHttpServer())
        .get(`${apiGlobalPrefix}/gastos-fixos/${gastoId}`)
        .expect(200);

      expect(response.body.id).toBe(gastoId);
      expect(response.body.descricao).toBe(createGastoDto.descricao);
      expect(response.body.previsto).toBe(createGastoDto.previsto);
      expect(response.body.categoria_id).toBe(createGastoDto.categoria_id);
      expect(response.body.orcamento_id).toBe(createGastoDto.orcamento_id);
    });

    it('should return 404 if gasto fixo not found', async () => {
      const response = await request(app.getHttpServer())
        .get(`${apiGlobalPrefix}/gastos-fixos/9999`)
        .expect(404);

      expect(response.body.message).toBe('Not Found');
    });
  });

  describe(`PATCH ${apiGlobalPrefix}/gastos-fixos/:id`, () => {
    it('should update an existing gasto fixo', async () => {
        const createGastoDto: GastoFixoCreateInputDto = {
            descricao: 'Descrição antiga',
            previsto: faker.number.float({ min: 1, max: 50, fractionDigits: 2 }).toString(),
            categoria_id: categoriaMock.id,
            orcamento_id: orcamentoMock.id,
        };

      const createResponse = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/gastos-fixos`)
        .send(createGastoDto)
        .expect(201);

      const gastoId = createResponse.body.id;

      const updateGastoDto: GastoFixoUpdateInputDto = {
        descricao: 'Gasto Fixo D Atualizado',
        valor: '500.35',
        data_pgto: new Date()
      };

      const response = await request(app.getHttpServer())
        .patch(`${apiGlobalPrefix}/gastos-fixos/${gastoId}`)
        .send(updateGastoDto)
        .expect(200);

      expect(response.body.descricao).toBe(updateGastoDto.descricao);
      expect(response.body.valor).toBe(updateGastoDto.valor);
    });

    it('should return 409 if add valor without data_pgto', async () => {
        const createGastoDto: GastoFixoCreateInputDto = {
            descricao: 'Descrição antiga',
            previsto: faker.number.float({ min: 1, max: 50, fractionDigits: 2 }).toString(),
            categoria_id: categoriaMock.id,
            orcamento_id: orcamentoMock.id,
        };

      const createResponse = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/gastos-fixos`)
        .send(createGastoDto)
        .expect(201);

      const gastoId = createResponse.body.id;

      const updateGastoDto: GastoFixoUpdateInputDto = {
        descricao: 'Gasto Fixo D Atualizado',
        valor: '500.35',
      };

      const response = await request(app.getHttpServer())
        .patch(`${apiGlobalPrefix}/gastos-fixos/${gastoId}`)
        .send(updateGastoDto)
        .expect(409);

      expect(response.body.message).toBe("Se o valor for preenchido, a data_pgto também deve ser preenchida.");
    });

    it('should return 404 if gasto fixo not found for update', async () => {
      const updateGastoDto: GastoFixoUpdateInputDto = {
        descricao: 'Gasto Fixo E Atualizado',
        valor: '600.00',
      };

      await request(app.getHttpServer())
        .patch(`${apiGlobalPrefix}/gastos-fixos/9999`)
        .send(updateGastoDto)
        .expect(404);
    });
  });

  describe(`DELETE ${apiGlobalPrefix}/gastos-fixos/:id`, () => {
    it('should soft delete a gasto fixo', async () => {
        const createGastoDto: GastoFixoCreateInputDto = {
            descricao: faker.string.alphanumeric(5),
            previsto: faker.number.float({ min: 1, max: 50, fractionDigits: 2 }).toString(),
            categoria_id: categoriaMock.id,
            orcamento_id: orcamentoMock.id,
        };

      const createResponse = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/gastos-fixos`)
        .send(createGastoDto)
        .expect(201);

      const gastoId = createResponse.body.id;

      const response = await request(app.getHttpServer())
        .delete(`${apiGlobalPrefix}/gastos-fixos/${gastoId}`)
        .expect(200);

      expect(response.body.soft_delete).toBeTruthy();
    });

    it('should return 404 if gasto fixo not found for delete', async () => {
      await request(app.getHttpServer())
        .delete(`${apiGlobalPrefix}/gastos-fixos/9999`)
        .expect(404);
    });
  });
});

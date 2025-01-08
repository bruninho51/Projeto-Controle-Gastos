import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { CategoriasGastosModule } from '../../src/modules/api/categorias-gastos/categorias-gastos.module';
import { PrismaService } from '../../src/modules/prisma/prisma.service';
import { CategoriaGastoCreateInputDto } from '../../src/modules/api/categorias-gastos/dtos/CategoriaGastoCreateInput.dto';
import * as request from 'supertest';
import { globalPipes } from '../../src/pipes/globalPipes';
import { globalFilters } from '../../src/filters/global-filters';
import { globalInterceptors } from '../../src/interceptors/globalInterceptors';
import { runPrismaMigrations } from '../utils/run-prisma-migrations';
import { faker } from '@faker-js/faker';

const apiGlobalPrefix = '/api/v1';

describe('CategoriasGastosController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    await runPrismaMigrations();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [CategoriasGastosModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.setGlobalPrefix(apiGlobalPrefix);

    prisma = moduleFixture.get<PrismaService>(PrismaService);

    globalPipes.forEach(gp => app.useGlobalPipes(gp));
    globalFilters.forEach(gf => app.useGlobalFilters(gf));
    globalInterceptors.forEach(gi => app.useGlobalInterceptors(gi));

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe(`GET ${apiGlobalPrefix}/categorias-gastos`, () => {
    it('should return an array of categorias de gastos', async () => {
      const response = await request(app.getHttpServer())
        .get(`${apiGlobalPrefix}/categorias-gastos`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('nome');
    });

    it('should not return soft deleted categorias de gastos', async () => {
      const categoria = await prisma.categoriaGasto.create({
        data: {
          nome: 'Teste',
          soft_delete: new Date(),
        }
      });

      const response = await request(app.getHttpServer())
        .get(`${apiGlobalPrefix}/categorias-gastos`);

      const result = response.body.filter(c => c.id === categoria.id);

      expect(result.length).toBe(0);
    });
  });

  describe(`POST ${apiGlobalPrefix}/categorias-gastos`, () => {
    it('should create a new categoria de gasto', async () => {
      const newCategoria: CategoriaGastoCreateInputDto = {
        nome: faker.string.alphanumeric(6).toUpperCase(),
      };

      const response = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/categorias-gastos`)
        .send(newCategoria)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.nome).toBe(newCategoria.nome);
    });

    it('should create categoria gasto even if it has already been created and deleted (soft delete)', async () => {
      const nome = faker.string.alphanumeric(6).toUpperCase();
      const categoria_gasto = await prisma.categoriaGasto.create({
        data: {
          nome,
          soft_delete: new Date(),
        },
      });

      const response = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/categorias-gastos`)
        .send({ nome })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.id).not.toBe(categoria_gasto.id);
      expect(response.body.nome).toBe(nome);
    });

    it('should return 409 if name exists when create', async () => {
      const nome = faker.string.alphanumeric(6).toUpperCase();
      await prisma.categoriaGasto.create({
        data: {
          nome,
        },
      });

      const newCategoria: CategoriaGastoCreateInputDto = {
        nome,
      };

      const response = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/categorias-gastos`)
        .send(newCategoria)
        .expect(409);

      expect(response.body.message).toBe('A categoria já existe. Por favor, escolha outro nome.');
    });

    it('should return 400 on pass an invalid field on create a categoria de gasto', async () => {
      const nome = faker.string.alphanumeric(6).toUpperCase();

      const newCategoria = {
        nome,
        stanger_field: 'hello'
      } as CategoriaGastoCreateInputDto;

      await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/categorias-gastos`)
        .send(newCategoria)
        .expect(400);
    });

    it('should return a 400 error if invalid data is passed', async () => {
      const invalidCategoria = {};

      const response = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/categorias-gastos`)
        .send(invalidCategoria)
        .expect(400);

      expect(response.body.message).toBeDefined();
    });
  });

  describe(`PATCH ${apiGlobalPrefix}/categorias-gastos/:id`, () => {
    it('should return 404 if try to update a categoria de gasto was deleted (soft delete)', async () => {
      const nome = faker.string.alphanumeric(6).toUpperCase();
      const categoria = await prisma.categoriaGasto.create({
        data: {
          nome,
          soft_delete: new Date(),
        },
      });

      const updatedCategoria = {
        nome,
      };

      await request(app.getHttpServer())
        .patch(`${apiGlobalPrefix}/categorias-gastos/${categoria.id}`)
        .send(updatedCategoria)
        .expect(404);

    });

    it('should update a categoria de gasto', async () => {
      const nome = faker.string.alphanumeric(6).toUpperCase();
      const categoria = await prisma.categoriaGasto.create({
        data: {
          nome,
        },
      });

      const updatedCategoria = {
        nome,
      };

      const response = await request(app.getHttpServer())
        .patch(`${apiGlobalPrefix}/categorias-gastos/${categoria.id}`)
        .send(updatedCategoria)
        .expect(200);

      expect(response.body.id).toBe(categoria.id);
      expect(response.body.nome).toBe(updatedCategoria.nome);
    });

    it('should return 404 if categoria de gasto does not exist', async () => {
      const nome = faker.string.alphanumeric(6).toUpperCase();
      await request(app.getHttpServer())
        .patch(`${apiGlobalPrefix}/categorias-gastos/999`)
        .send({ nome })
        .expect(404);
    });

    it('should return 409 if name exists when update', async () => {
      const nome1 = faker.string.alphanumeric(6).toUpperCase();
      const nome2 = faker.string.alphanumeric(6).toUpperCase();

      const categoriaGasto1 = await prisma.categoriaGasto.create({
        data: { nome: nome1 },
      });

      await prisma.categoriaGasto.create({
        data: { nome: nome2 },
      });

      await request(app.getHttpServer())
        .patch(`${apiGlobalPrefix}/categorias-gastos/${categoriaGasto1.id}`)
        .send({ nome: nome2 })
        .expect(409);
    });
  });

  describe(`DELETE ${apiGlobalPrefix}/categorias-gastos/:id`, () => {
    it('should soft delete a categoria de gasto', async () => {
      const nome = faker.string.alphanumeric(6).toUpperCase();
      const categoria = await prisma.categoriaGasto.create({
        data: {
          nome,
        },
      });

      const response = await request(app.getHttpServer())
        .delete(`${apiGlobalPrefix}/categorias-gastos/${categoria.id}`)
        .expect(200);

      expect(response.body).toHaveProperty('soft_delete');
    });

    it('should return 404 if categoria de gasto was deleted (soft delete)', async () => {
      const nome = faker.string.alphanumeric(6).toUpperCase();
      const categoria = await prisma.categoriaGasto.create({
        data: {
          nome,
        },
      });

      await request(app.getHttpServer())
        .delete(`${apiGlobalPrefix}/categorias-gastos/${categoria.id}`)
        .expect(200);

      await request(app.getHttpServer())
        .delete(`${apiGlobalPrefix}/categorias-gastos/${categoria.id}`)
        .expect(404);

    });

    it('should return 404 if categoria de gasto does not exist', async () => {
      await request(app.getHttpServer())
        .delete(`${apiGlobalPrefix}/categorias-gastos/999`)
        .expect(404);

    });
  });
});

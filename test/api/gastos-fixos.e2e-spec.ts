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
import { OrcamentoCreateInputDto } from '../../src/modules/api/orcamentos/dtos/OrcamentoCreateInput.dto';
import { OrcamentosModule } from '../../src/modules/api/orcamentos/orcamentos.module';

jest.setTimeout(10000); // 10 segundos

const apiGlobalPrefix = '/api/v1';

describe('GastosFixosController (v1) (E2E)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  let categoriaMock: CategoriaGasto;
  let orcamentoMock: Orcamento;

  beforeAll(async () => {
    await runPrismaMigrations();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [OrcamentosModule, GastosFixosModule],
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
      };

      const response = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/orcamentos/${orcamentoMock.id}/gastos-fixos`)
        .send(createGastoDto)
        .expect(201);

        expect(response.body).toHaveProperty('id');
        expect(response.body.descricao).toBe(createGastoDto.descricao);
        expect(response.body.previsto).toBe(createGastoDto.previsto);
        expect(response.body.categoria_id).toBe(createGastoDto.categoria_id);
        expect(response.body.orcamento_id).toBe(orcamentoMock.id);
    });

    it('should return 400 with correct messages when create a new gasto fixo when all fiends as null', async () => {
      const createGastoDto: Required<GastoFixoCreateInputDto> = {
        descricao: null,
        previsto: null,
        categoria_id: null,
        observacoes: null,
      };

      const response = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/orcamentos/${orcamentoMock.id}/gastos-fixos`)
        .send(createGastoDto)
        .expect(400);

        expect(response.body).toHaveProperty('message');
        expect(Array.isArray(response.body.message)).toBe(true);
      
        expect(response.body.message).toEqual([
          'descricao should not be empty',
          'descricao must be a string',
          'previsto should not be empty',
          'previsto is not a valid decimal number.',
          'categoria_id should not be empty',
          'categoria_id must be an integer number'
        ]);
    });

    it('should return 400 with correct messages when create a new gasto fixo when all fiends as wrong', async () => {
      const createGastoDto: Required<GastoFixoCreateInputDto> = {
        descricao: faker.number.int({ min: 100, max: 999 }) as unknown as string,
        previsto: faker.string.alpha(5),
        categoria_id: faker.string.alpha(5) as unknown as number,
        observacoes: faker.number.int() as unknown as string,
      };

      const response = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/orcamentos/${orcamentoMock.id}/gastos-fixos`)
        .send(createGastoDto)
        .expect(400);

        expect(response.body).toHaveProperty('message');
        expect(Array.isArray(response.body.message)).toBe(true);
      
        expect(response.body.message).toEqual([
          'descricao must be a string',
          'previsto is not a valid decimal number.',
          'categoria_id must be an integer number',
          'observacoes must be a string',
        ]);
    });

    it('should return 404 when categoria gasto does not exists', async () => {
      const createGastoDto: GastoFixoCreateInputDto = {
        descricao: faker.string.alphanumeric(5),
        previsto: faker.number.float({ min: 1, max: 50, fractionDigits: 2 }).toString(),
        categoria_id: 999,
      };

      const response = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/orcamentos/${orcamentoMock.id}/gastos-fixos`)
        .send(createGastoDto)
        .expect(404);

        expect(response.body.message).toBe("A categoria informada não foi encontrada.");
    });

    it('should return 404 when orcamento does not exists', async () => {
      const createGastoDto: GastoFixoCreateInputDto = {
        descricao: faker.string.alphanumeric(5),
        previsto: faker.number.float({ min: 1, max: 50, fractionDigits: 2 }).toString(),
        categoria_id: categoriaMock.id,
      };

      const response = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/orcamentos/999/gastos-fixos`)
        .send(createGastoDto)
        .expect(404);

        expect(response.body.message).toBe("O orçamento informado não foi encontrado.");
    });

    it('should return 400 on passing an invalid field on create a new gasto fixo', async () => {
        const createGastoDto = {
            descricao: faker.string.alphanumeric(5),
            previsto: faker.number.float({ min: 1, max: 50, fractionDigits: 2 }).toString(),
            categoria_id: categoriaMock.id,
            invalid_field: 'invalid'
        } as GastoFixoCreateInputDto;
    

      await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/orcamentos/${orcamentoMock.id}/gastos-fixos`)
        .send(createGastoDto)
        .expect(400);
    });
  });

  describe(`GET ${apiGlobalPrefix}/gastos-fixos`, () => {
    it('should return all gastos fixos', async () => {
      const orcamentoMock2: OrcamentoCreateInputDto = {
        nome: faker.string.alphanumeric(5),
        valor_inicial: faker.number.float({ min: 100, max: 999, fractionDigits: 2 }).toString(),
      }

      const orcamento2 = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/orcamentos`)
        .send(orcamentoMock2)
        .expect(201);

      const gastoFixoOrcamento2: GastoFixoCreateInputDto = {
        categoria_id: categoriaMock.id,
        descricao: faker.string.alphanumeric(5),
        previsto: faker.number.float({ min: 100, max: 999, fractionDigits: 2 }).toString(),
        observacoes: faker.string.alphanumeric(5),
      }

      await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/orcamentos/${orcamentoMock2}/gastos-fixos`)
        .send(gastoFixoOrcamento2)
        .expect(201);

      const responseOrcamentoMock = await request(app.getHttpServer())
        .get(`${apiGlobalPrefix}/orcamentos/${orcamentoMock.id}/gastos-fixos`)
        .expect(200);

        const responseOrcamentoMock2 = await request(app.getHttpServer())
        .get(`${apiGlobalPrefix}/orcamentos/${orcamento2.body.id}/gastos-fixos`)
        .expect(200);

      const orcamento1Ok = responseOrcamentoMock.body.every(reg => reg.orcamento_id === orcamentoMock.id);
      const orcamento2Ok = responseOrcamentoMock2.body.every(reg => reg.orcamento_id === orcamento2.body.id);

      expect(orcamento1Ok).toBeTruthy();
      expect(orcamento2Ok).toBeTruthy();
    });
  });

  describe(`GET ${apiGlobalPrefix}/gastos-fixos/:id`, () => {
    it('should return a single gasto fixo', async () => {
        const createGastoDto: GastoFixoCreateInputDto = {
            descricao: faker.string.alphanumeric(5),
            previsto: faker.number.float({ min: 1, max: 50, fractionDigits: 2 }).toString(),
            categoria_id: categoriaMock.id,
        };

      const createResponse = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/orcamentos/${orcamentoMock.id}/gastos-fixos`)
        .send(createGastoDto)
        .expect(201);

      const gastoId = createResponse.body.id;

      const response = await request(app.getHttpServer())
        .get(`${apiGlobalPrefix}/orcamentos/${orcamentoMock.id}/gastos-fixos/${gastoId}`)
        .expect(200);

      expect(response.body.id).toBe(gastoId);
      expect(response.body.descricao).toBe(createGastoDto.descricao);
      expect(response.body.previsto).toBe(createGastoDto.previsto);
      expect(response.body.categoria_id).toBe(createGastoDto.categoria_id);
      expect(response.body.orcamento_id).toBe(orcamentoMock.id);
    });

    it('should return a 404 error if the gasto fixo exists but does not belong to the specified orcamento', async () => {
      const orcamentoMock2: OrcamentoCreateInputDto = {
        nome: faker.string.alphanumeric(5),
        valor_inicial: faker.number.float({ min: 100, max: 999, fractionDigits: 2 }).toString(),
      }

      const orcamento2 = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/orcamentos`)
        .send(orcamentoMock2)
        .expect(201);
      
      const createGastoDto: GastoFixoCreateInputDto = {
          descricao: faker.string.alphanumeric(5),
          previsto: faker.number.float({ min: 1, max: 50, fractionDigits: 2 }).toString(),
          categoria_id: categoriaMock.id,
      };

    const createResponse = await request(app.getHttpServer())
      .post(`${apiGlobalPrefix}/orcamentos/${orcamentoMock.id}/gastos-fixos`)
      .send(createGastoDto)
      .expect(201);

    const gastoId = createResponse.body.id;

    await request(app.getHttpServer())
      .get(`${apiGlobalPrefix}/orcamentos/${orcamento2.body.id}/gastos-fixos/${gastoId}`)
      .expect(404);    
  });

    it('should return 404 if gasto fixo not found', async () => {
      const response = await request(app.getHttpServer())
        .get(`${apiGlobalPrefix}/orcamentos/${orcamentoMock.id}/gastos-fixos/9999`)
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
        };

      const createResponse = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/orcamentos/${orcamentoMock.id}/gastos-fixos`)
        .send(createGastoDto)
        .expect(201);

      const gastoId = createResponse.body.id;

      const updateGastoDto: GastoFixoUpdateInputDto = {
        descricao: 'Gasto Fixo D Atualizado',
        valor: '500.35',
        data_pgto: new Date()
      };

      const response = await request(app.getHttpServer())
        .patch(`${apiGlobalPrefix}/orcamentos/${orcamentoMock.id}/gastos-fixos/${gastoId}`)
        .send(updateGastoDto)
        .expect(200);

      expect(response.body.descricao).toBe(updateGastoDto.descricao);
      expect(response.body.valor).toBe(updateGastoDto.valor);
    });

    it('should return 400 with correct messages when update a gasto fixo when all fiends as null', async () => {
      const createGastoDto: GastoFixoCreateInputDto = {
          descricao: 'Descrição antiga',
          previsto: faker.number.float({ min: 1, max: 50, fractionDigits: 2 }).toString(),
          categoria_id: categoriaMock.id,
      };

    const createResponse = await request(app.getHttpServer())
      .post(`${apiGlobalPrefix}/orcamentos/${orcamentoMock.id}/gastos-fixos`)
      .send(createGastoDto)
      .expect(201);

    const gastoId = createResponse.body.id;

    const updateGastoDto: Required<GastoFixoUpdateInputDto> = {
      descricao: null,
      previsto: null,
      valor: null,
      categoria_id: null,
      data_pgto: null,
      data_inatividade: null,
      observacoes: null,
    };

    const response = await request(app.getHttpServer())
      .patch(`${apiGlobalPrefix}/orcamentos/${orcamentoMock.id}/gastos-fixos/${gastoId}`)
      .send(updateGastoDto)
      .expect(400);

      expect(response.body).toHaveProperty('message');
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

      it('should return 400 with correct messages when update a gasto fixo when all fiends as wrong', async () => {
        const createGastoDto: GastoFixoCreateInputDto = {
            descricao: 'Descrição antiga',
            previsto: faker.number.float({ min: 1, max: 50, fractionDigits: 2 }).toString(),
            categoria_id: categoriaMock.id,
        };
  
      const createResponse = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/orcamentos/${orcamentoMock.id}/gastos-fixos`)
        .send(createGastoDto)
        .expect(201);
  
      const gastoId = createResponse.body.id;
  
      const updateGastoDto: Required<GastoFixoUpdateInputDto> = {
        descricao: faker.number.int({ min: 100, max: 999 }) as unknown as string,
        previsto: faker.string.alpha(5),
        valor: faker.string.alpha(5),
        categoria_id: faker.string.alpha(5) as unknown as number,
        data_pgto: faker.number.int({ min: 100, max: 999 }) as unknown as Date,
        data_inatividade: faker.number.int({ min: 100, max: 999 }) as unknown as Date,
        observacoes: faker.number.int({ min: 100, max: 999 }) as unknown as string,
      };
  
      const response = await request(app.getHttpServer())
        .patch(`${apiGlobalPrefix}/orcamentos/${orcamentoMock.id}/gastos-fixos/${gastoId}`)
        .send(updateGastoDto)
        .expect(400);
  
        expect(response.body).toHaveProperty('message');
        expect(Array.isArray(response.body.message)).toBe(true);
      
        expect(response.body.message).toEqual([
          "descricao must be a string",
          "previsto is not a valid decimal number.",
          "valor is not a valid decimal number.",
          "categoria_id must be an integer number",
          "observacoes must be a string"
        ]);
    });

    it('should return 200 when inactivate a gasto fixo', async () => {
      const createGastoDto: GastoFixoCreateInputDto = {
          descricao: 'Descrição antiga',
          previsto: faker.number.float({ min: 1, max: 50, fractionDigits: 2 }).toString(),
          categoria_id: categoriaMock.id,
      };

    const createResponse = await request(app.getHttpServer())
      .post(`${apiGlobalPrefix}/orcamentos/${orcamentoMock.id}/gastos-fixos`)
      .send(createGastoDto)
      .expect(201);

    const gastoId = createResponse.body.id;

    const updateGastoDto: GastoFixoUpdateInputDto = {
      data_inatividade: new Date()
    };

    const response = await request(app.getHttpServer())
      .patch(`${apiGlobalPrefix}/orcamentos/${orcamentoMock.id}/gastos-fixos/${gastoId}`)
      .send(updateGastoDto)
      .expect(200);

      expect(response.body.data_inatividade).toBeTruthy();
    });

    it('should return 200 when activate a gasto fixo', async () => {
      const createGastoDto: GastoFixoCreateInputDto = {
          descricao: 'Descrição antiga',
          previsto: faker.number.float({ min: 1, max: 50, fractionDigits: 2 }).toString(),
          categoria_id: categoriaMock.id,
      };

    const createResponse = await request(app.getHttpServer())
      .post(`${apiGlobalPrefix}/orcamentos/${orcamentoMock.id}/gastos-fixos`)
      .send(createGastoDto)
      .expect(201);

    const gastoId = createResponse.body.id;

    const updateGastoDto: GastoFixoUpdateInputDto = {
      data_inatividade: null
    };

    const response = await request(app.getHttpServer())
      .patch(`${apiGlobalPrefix}/orcamentos/${orcamentoMock.id}/gastos-fixos/${gastoId}`)
      .send(updateGastoDto)
      .expect(200);

      expect(response.body.data_inatividade).toBeNull();
    });

    it('should return a 404 error if the gasto fixo exists but does not belong to the specified orcamento', async () => {
      const orcamentoMock2: OrcamentoCreateInputDto = {
        nome: faker.string.alphanumeric(5),
        valor_inicial: faker.number.float({ min: 100, max: 999, fractionDigits: 2 }).toString(),
      }

      const orcamento2 = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/orcamentos`)
        .send(orcamentoMock2)
        .expect(201);
      
      const createGastoDto: GastoFixoCreateInputDto = {
          descricao: 'Descrição antiga',
          previsto: faker.number.float({ min: 1, max: 50, fractionDigits: 2 }).toString(),
          categoria_id: categoriaMock.id,
      };

      const createResponse = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/orcamentos/${orcamentoMock.id}/gastos-fixos`)
        .send(createGastoDto)
        .expect(201);

      const gastoId = createResponse.body.id;

      const updateGastoDto: GastoFixoUpdateInputDto = {
        descricao: 'Gasto Fixo D Atualizado',
        valor: '500.35',
        data_pgto: new Date()
      };

      await request(app.getHttpServer())
        .patch(`${apiGlobalPrefix}/orcamentos/${orcamento2.body.id}/gastos-fixos/${gastoId}`)
        .send(updateGastoDto)
        .expect(404);
    });

    it('should return 409 if add valor without data_pgto', async () => {
        const createGastoDto: GastoFixoCreateInputDto = {
            descricao: 'Descrição antiga',
            previsto: faker.number.float({ min: 1, max: 50, fractionDigits: 2 }).toString(),
            categoria_id: categoriaMock.id,
        };

      const createResponse = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/orcamentos/${orcamentoMock.id}/gastos-fixos`)
        .send(createGastoDto)
        .expect(201);

      const gastoId = createResponse.body.id;

      const updateGastoDto: GastoFixoUpdateInputDto = {
        descricao: 'Gasto Fixo D Atualizado',
        valor: '500.35',
      };

      const response = await request(app.getHttpServer())
        .patch(`${apiGlobalPrefix}/orcamentos/${orcamentoMock.id}/gastos-fixos/${gastoId}`)
        .send(updateGastoDto)
        .expect(409);

      expect(response.body.message).toBe("Se o valor for preenchido, a data_pgto também deve ser preenchida.");
    });

    it('should return 409 if add valor without a null data_pgto', async () => {
      const createGastoDto: GastoFixoCreateInputDto = {
          descricao: 'Descrição antiga',
          previsto: faker.number.float({ min: 1, max: 50, fractionDigits: 2 }).toString(),
          categoria_id: categoriaMock.id,
      };

    const createResponse = await request(app.getHttpServer())
      .post(`${apiGlobalPrefix}/orcamentos/${orcamentoMock.id}/gastos-fixos`)
      .send(createGastoDto)
      .expect(201);

    const gastoId = createResponse.body.id;

    const updateGastoDto: GastoFixoUpdateInputDto = {
      descricao: 'Gasto Fixo D Atualizado',
      valor: '500.35',
      data_pgto: null,
    };

    const response = await request(app.getHttpServer())
      .patch(`${apiGlobalPrefix}/orcamentos/${orcamentoMock.id}/gastos-fixos/${gastoId}`)
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
        .patch(`${apiGlobalPrefix}/orcamentos/${orcamentoMock.id}/gastos-fixos/9999`)
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
        };

      const createResponse = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/orcamentos/${orcamentoMock.id}/gastos-fixos`)
        .send(createGastoDto)
        .expect(201);

      const gastoId = createResponse.body.id;

      const response = await request(app.getHttpServer())
        .delete(`${apiGlobalPrefix}/orcamentos/${orcamentoMock.id}/gastos-fixos/${gastoId}`)
        .expect(200);

      expect(response.body.soft_delete).toBeTruthy();
    });

    it('should return 404 if gasto fixo not found for delete', async () => {
      await request(app.getHttpServer())
        .delete(`${apiGlobalPrefix}/orcamentos/${orcamentoMock.id}/gastos-fixos/9999`)
        .expect(404);
    });

    it('should return a 404 error if the gasto fixo exists but does not belong to the specified orcamento', async () => {
      const orcamentoMock2: OrcamentoCreateInputDto = {
        nome: faker.string.alphanumeric(5),
        valor_inicial: faker.number.float({ min: 100, max: 999, fractionDigits: 2 }).toString(),
      }

      const orcamento2 = await request(app.getHttpServer())
        .post(`${apiGlobalPrefix}/orcamentos`)
        .send(orcamentoMock2)
        .expect(201);
      
      const createGastoDto: GastoFixoCreateInputDto = {
          descricao: faker.string.alphanumeric(5),
          previsto: faker.number.float({ min: 1, max: 50, fractionDigits: 2 }).toString(),
          categoria_id: categoriaMock.id,
      };

    const createResponse = await request(app.getHttpServer())
      .post(`${apiGlobalPrefix}/orcamentos/${orcamentoMock.id}/gastos-fixos`)
      .send(createGastoDto)
      .expect(201);

    const gastoId = createResponse.body.id;

    await request(app.getHttpServer())
      .delete(`${apiGlobalPrefix}/orcamentos/${orcamento2.body.id}/gastos-fixos/${gastoId}`)
      .expect(404);
  });
  });
});

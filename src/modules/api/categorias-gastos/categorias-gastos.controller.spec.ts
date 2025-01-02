import { Test, TestingModule } from '@nestjs/testing';
import { CategoriasGastosController } from './categorias-gastos.controller';
import { CategoriasGastosService } from './categorias-gastos.service';
import { CategoriaGastoCreateInputDto } from './dtos/CategoriaGastoCreateInput.dto';
import { CategoriaGastoUpdateInputDto } from './dtos/CategoriaGastoUpdateInput.dto';
import { CategoriaGasto } from '@prisma/client';

describe('CategoriasGastosController', () => {
  let controller: CategoriasGastosController;
  let service: CategoriasGastosService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoriasGastosController],
      providers: [
        {
          provide: CategoriasGastosService,
          useValue: {
            findAll: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            softDelete: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<CategoriasGastosController>(CategoriasGastosController);
    service = module.get<CategoriasGastosService>(CategoriasGastosService);
  });

  describe('findAll', () => {
    it('should return an array of categorias de gastos', async () => {
      const result = [{ id: 1, nome: 'Alimentação' }] as CategoriaGasto[];
      jest.spyOn(service, 'findAll').mockResolvedValue(result);

      expect(await controller.findAll()).toBe(result);
    });
  });

  describe('create', () => {
    it('should create a new categoria de gasto', async () => {
      const createCategoriaDto: CategoriaGastoCreateInputDto = { nome: 'Transporte' };
      const result = { id: 1, ...createCategoriaDto } as CategoriaGasto;

      jest.spyOn(service, 'create').mockResolvedValue(result);

      expect(await controller.create(createCategoriaDto)).toBe(result);
    });
  });

  describe('update', () => {
    it('should update an existing categoria de gasto', async () => {
      const id = 1;
      const updateCategoriaDto: CategoriaGastoUpdateInputDto = { nome: 'Saúde' };
      const result = { id, ...updateCategoriaDto } as CategoriaGasto;

      jest.spyOn(service, 'update').mockResolvedValue(result);

      expect(await controller.update(id, updateCategoriaDto)).toBe(result);
    });
  });

  describe('remove', () => {
    it('should delete a categoria de gasto (soft delete)', async () => {
      const id = 1;
      const result = { id, soft_delete: new Date() } as CategoriaGasto;

      jest.spyOn(service, 'softDelete').mockResolvedValue(result);

      expect(await controller.remove(id)).toBe(result);
    });
  });
});

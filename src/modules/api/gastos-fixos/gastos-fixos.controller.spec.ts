import { Test, TestingModule } from '@nestjs/testing';
import { GastosFixosController } from './gastos-fixos.controller';
import { GastosFixosService } from './gastos-fixos.service';
import { GastoFixoCreateInputDto } from './dtos/GastoFixoCreateInput.dto';
import { GastoFixoUpdateInputDto } from './dtos/GastoFixoUpdateInput.dto';
import { faker } from '@faker-js/faker';

const mockGastosFixosService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  softDelete: jest.fn(),
};

describe('GastosFixosController', () => {
  let controller: GastosFixosController;
  let service: GastosFixosService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GastosFixosController],
      providers: [
        GastosFixosService,
        {
          provide: GastosFixosService,
          useValue: mockGastosFixosService,
        },
      ],
    }).compile();

    controller = module.get<GastosFixosController>(GastosFixosController);
    service = module.get<GastosFixosService>(GastosFixosService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new gasto fixo', async () => {
      const orcamento_id = faker.number.int().toString();

      const createGastoDto: GastoFixoCreateInputDto = {
        descricao: faker.string.alphanumeric(5),
        observacoes: faker.string.alphanumeric(5),
        categoria_id: faker.number.int(),
        previsto: faker.number.float({ min: 100, max: 9999, fractionDigits: 2 }).toString(),
      };

      const createdGasto = { 
        ...createGastoDto, 
        id: 1, 
        data_criacao: new Date(), 
        data_atualizacao: new Date(),
      };

      mockGastosFixosService.create.mockResolvedValue(createdGasto);

      const result = await controller.create(orcamento_id, createGastoDto);

      expect(result).toEqual(createdGasto);
      expect(service.create).toHaveBeenCalledWith(+orcamento_id, createGastoDto);
    });
  });

  describe('findAll', () => {
    it('should return an array of gastos fixos', async () => {
      const orcamento_id = faker.number.int().toString();

      const gastos = [
        { id: 1, descricao: 'Aluguel', previsto: '1200.00' },
        { id: 2, descricao: 'Internet', previsto: '150.00' },
      ];

      mockGastosFixosService.findAll.mockResolvedValue(gastos);

      const result = await controller.findAll(orcamento_id);

      expect(result).toEqual(gastos);
      expect(service.findAll).toHaveBeenCalledWith(+orcamento_id);
    });
  });

  describe('findOne', () => {
    it('should return a gasto fixo by id', async () => {
      const orcamento_id = faker.number.int().toString();
      const gasto_fixo_id = faker.number.int().toString();

      const gasto = { id: gasto_fixo_id, descricao: 'Aluguel', previsto: '1200.00' };

      mockGastosFixosService.findOne.mockResolvedValue(gasto);

      const result = await controller.findOne(orcamento_id, gasto_fixo_id);

      expect(result).toEqual(gasto);
      expect(service.findOne).toHaveBeenCalledWith(+orcamento_id, +gasto_fixo_id);
    });

    it('should return null if gasto fixo not found', async () => {
      const orcamento_id = faker.number.int().toString();
      const gasto_fixo_id = '999';

      mockGastosFixosService.findOne.mockResolvedValue(null);

      const result = await controller.findOne(orcamento_id, gasto_fixo_id);

      expect(result).toBeNull();
      expect(service.findOne).toHaveBeenCalledWith(+orcamento_id, +gasto_fixo_id);
    });
  });

  describe('update', () => {
    it('should update a gasto fixo', async () => {
      const orcamento_id = faker.number.int().toString();
      const gasto_fixo_id = faker.number.int().toString();

      const updateGastoDto: GastoFixoUpdateInputDto = {
        descricao: 'Aluguel Atualizado',
        previsto: '1300.00',
      };

      const updatedGasto = { 
        ...updateGastoDto, 
        id: 1, 
        data_atualizacao: new Date(),
      };

      mockGastosFixosService.update.mockResolvedValue(updatedGasto);

      const result = await controller.update(orcamento_id, gasto_fixo_id, updateGastoDto);

      expect(result).toEqual(updatedGasto);
      expect(service.update).toHaveBeenCalledWith(+orcamento_id, +gasto_fixo_id, updateGastoDto);
    });
  });

  describe('remove', () => {
    it('should perform a soft delete of a gasto fixo', async () => {
      const orcamento_id = faker.number.int().toString();
      const gasto_fixo_id = faker.number.int().toString();

      const gastoToDelete = { id: gasto_fixo_id, descricao: 'Aluguel', previsto: '1200.00' };

      mockGastosFixosService.softDelete.mockResolvedValue(gastoToDelete);

      const result = await controller.remove(orcamento_id, gasto_fixo_id);

      expect(result).toEqual(gastoToDelete);
      expect(service.softDelete).toHaveBeenCalledWith(+orcamento_id, +gasto_fixo_id);
    });
  });
});

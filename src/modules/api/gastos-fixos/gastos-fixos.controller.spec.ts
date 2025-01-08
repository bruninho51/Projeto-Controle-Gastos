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
      const createGastoDto: GastoFixoCreateInputDto = {
        descricao: faker.string.alphanumeric(5),
        observacoes: faker.string.alphanumeric(5),
        categoria_id: faker.number.int(),
        orcamento_id: faker.number.int(),
        previsto: faker.number.float({ min: 100, max: 9999, fractionDigits: 2 }).toString(),
      };

      const createdGasto = { 
        ...createGastoDto, 
        id: 1, 
        data_criacao: new Date(), 
        data_atualizacao: new Date(),
      };

      mockGastosFixosService.create.mockResolvedValue(createdGasto);

      const result = await controller.create(createGastoDto);

      expect(result).toEqual(createdGasto);
      expect(service.create).toHaveBeenCalledWith(createGastoDto);
    });
  });

  describe('findAll', () => {
    it('should return an array of gastos fixos', async () => {
      const gastos = [
        { id: 1, descricao: 'Aluguel', previsto: '1200.00' },
        { id: 2, descricao: 'Internet', previsto: '150.00' },
      ];

      mockGastosFixosService.findAll.mockResolvedValue(gastos);

      const result = await controller.findAll();

      expect(result).toEqual(gastos);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a gasto fixo by id', async () => {
      const gasto = { id: 1, descricao: 'Aluguel', previsto: '1200.00' };

      mockGastosFixosService.findOne.mockResolvedValue(gasto);

      const result = await controller.findOne('1');

      expect(result).toEqual(gasto);
      expect(service.findOne).toHaveBeenCalledWith(1);
    });

    it('should return null if gasto fixo not found', async () => {
      mockGastosFixosService.findOne.mockResolvedValue(null);

      const result = await controller.findOne('999');

      expect(result).toBeNull();
      expect(service.findOne).toHaveBeenCalledWith(999);
    });
  });

  describe('update', () => {
    it('should update a gasto fixo', async () => {
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

      const result = await controller.update('1', updateGastoDto);

      expect(result).toEqual(updatedGasto);
      expect(service.update).toHaveBeenCalledWith(1, updateGastoDto);
    });
  });

  describe('remove', () => {
    it('should perform a soft delete of a gasto fixo', async () => {
      const gastoToDelete = { id: 1, descricao: 'Aluguel', previsto: '1200.00' };

      mockGastosFixosService.softDelete.mockResolvedValue(gastoToDelete);

      const result = await controller.remove('1');

      expect(result).toEqual(gastoToDelete);
      expect(service.softDelete).toHaveBeenCalledWith(1);
    });
  });
});

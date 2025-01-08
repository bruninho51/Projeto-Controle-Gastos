import { Test, TestingModule } from '@nestjs/testing';
import { GastosFixosService } from './gastos-fixos.service';
import { PrismaService } from '../../prisma/prisma.service';
import { GastoFixoCreateInputDto } from './dtos/GastoFixoCreateInput.dto';
import { GastoFixoUpdateInputDto } from './dtos/GastoFixoUpdateInput.dto';
import { faker } from '@faker-js/faker';

const mockPrismaService = {
  gastoFixo: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
};

describe('GastosFixosService', () => {
  let service: GastosFixosService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GastosFixosService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<GastosFixosService>(GastosFixosService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
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

      const createdGastoFixo = {
        id: 1,
        ...createGastoDto,
        data_criacao: new Date(),
        data_atualizacao: new Date(),
      };

      mockPrismaService.gastoFixo.create.mockResolvedValue(createdGastoFixo);

      const result = await service.create(createGastoDto);

      expect(result).toEqual(createdGastoFixo);
      expect(mockPrismaService.gastoFixo.create).toHaveBeenCalledWith({
        data: createGastoDto,
      });
    });
  });

  describe('findAll', () => {
    it('should return an array of gasto fixo', async () => {
      const gastosFixos = [
        { id: 1, descricao: 'Gasto Fixo A', previsto: '1000.00', observacoes: 'Descrição A' },
        { id: 2, descricao: 'Gasto Fixo B', previsto: '500.00', observacoes: 'Descrição B' },
      ];

      mockPrismaService.gastoFixo.findMany.mockResolvedValue(gastosFixos);

      const result = await service.findAll();

      expect(result).toEqual(gastosFixos);
      expect(mockPrismaService.gastoFixo.findMany).toHaveBeenCalledWith({
        where: { soft_delete: null },
      });
    });
  });

  describe('findOne', () => {
    it('should return a single gasto fixo by id', async () => {
      const gastoFixo = {
        id: 1,
        descricao: 'Gasto Fixo A',
        previsto: 1000.00,
        observacoes: 'Descrição A',
        data_criacao: new Date(),
        data_atualizacao: new Date(),
      };

      mockPrismaService.gastoFixo.findUnique.mockResolvedValue(gastoFixo);

      const result = await service.findOne(1);

      expect(result).toEqual(gastoFixo);
      expect(mockPrismaService.gastoFixo.findUnique).toHaveBeenCalledWith({
        where: { id: 1, soft_delete: null },
      });
    });

    it('should return null if gasto fixo not found', async () => {
      mockPrismaService.gastoFixo.findUnique.mockResolvedValue(null);

      const result = await service.findOne(999);

      expect(result).toBeNull();
      expect(mockPrismaService.gastoFixo.findUnique).toHaveBeenCalledWith({
        where: { id: 999, soft_delete: null },
      });
    });
  });

  describe('update', () => {
    it('should update a gasto fixo', async () => {
      const updateGastoDto: GastoFixoUpdateInputDto = {
        descricao: 'Gasto Fixo A Atualizado',
        previsto: '1500.00',
        observacoes: 'Descrição do Gasto Fixo A Atualizado',
      };

      const updatedGastoFixo = {
        id: 1,
        ...updateGastoDto,
        data_criacao: new Date(),
        data_atualizacao: new Date(),
      };

      mockPrismaService.gastoFixo.update.mockResolvedValue(updatedGastoFixo);

      const result = await service.update(1, updateGastoDto);

      expect(result).toEqual(updatedGastoFixo);
      expect(mockPrismaService.gastoFixo.update).toHaveBeenCalledWith({
        where: { id: 1, soft_delete: null },
        data: updateGastoDto,
      });
    });
  });

  describe('softDelete', () => {
    it('should perform a soft delete of a gasto fixo', async () => {
      const gastoFixoToDelete = {
        id: 1,
        descricao: 'Gasto Fixo A',
        previsto: '1000.00',
        observacoes: 'Descrição A',
      };

      const softDeletedGastoFixo = {
        ...gastoFixoToDelete,
        soft_delete: new Date(),
      };

      mockPrismaService.gastoFixo.update.mockResolvedValue(softDeletedGastoFixo);

      const result = await service.softDelete(1);

      expect(result).toEqual(softDeletedGastoFixo);
      expect(mockPrismaService.gastoFixo.update).toHaveBeenCalledWith({
        where: { id: 1, soft_delete: null },
        data: { soft_delete: expect.any(Date) },
      });
    });
  });
});

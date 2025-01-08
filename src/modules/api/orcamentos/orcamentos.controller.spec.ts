import { Test, TestingModule } from '@nestjs/testing';
import { OrcamentosController } from './orcamentos.controller';
import { OrcamentosService } from './orcamentos.service';
import { OrcamentoCreateInputDto } from './dtos/OrcamentoCreateInput.dto';
import { OrcamentoUpdateInputDto } from './dtos/OrcamentoUpdateInput.dto';

const mockOrcamentosService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  softDelete: jest.fn(),
};

describe('OrcamentoController', () => {
  let controller: OrcamentosController;
  let service: OrcamentosService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrcamentosController],
      providers: [
        OrcamentosService,
        {
          provide: OrcamentosService,
          useValue: mockOrcamentosService,
        },
      ],
    }).compile();

    controller = module.get<OrcamentosController>(OrcamentosController);
    service = module.get<OrcamentosService>(OrcamentosService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new orcamento', async () => {
      const createOrcamentoDto: OrcamentoCreateInputDto = {
        nome: 'Orçamento A',
        valor_inicial: '1000.00',
      };

      const createdOrcamento = {
        ...createOrcamentoDto,
        id: 1,
        data_criacao: new Date(),
        data_atualizacao: new Date(),
      };

      mockOrcamentosService.create.mockResolvedValue(createdOrcamento);

      const result = await controller.create(createOrcamentoDto);

      expect(result).toEqual(createdOrcamento);
      expect(service.create).toHaveBeenCalledWith(createOrcamentoDto);
    });
  });

  describe('findAll', () => {
    it('should return an array of orcamentos', async () => {
      const orcamentos = [
        { id: 1, nome: 'Orçamento A', valor_inicial: '1000.00', valor_atual: '1200.00', valor_livre: '200.00' },
        { id: 2, nome: 'Orçamento B', valor_inicial: '500.00', valor_atual: '600.00', valor_livre: '100.00' },
      ];

      mockOrcamentosService.findAll.mockResolvedValue(orcamentos);

      const result = await controller.findAll();

      expect(result).toEqual(orcamentos);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a single orcamento by id', async () => {
      const orcamento = { id: 1, nome: 'Orçamento A', valor_inicial: '1000.00', valor_atual: '1200.00', valor_livre: '200.00' };

      mockOrcamentosService.findOne.mockResolvedValue(orcamento);

      const result = await controller.findOne('1');

      expect(result).toEqual(orcamento);
      expect(service.findOne).toHaveBeenCalledWith(1);
    });

    it('should return null if orcamento not found', async () => {
      mockOrcamentosService.findOne.mockResolvedValue(null);

      const result = await controller.findOne('999');

      expect(result).toBeNull();
      expect(service.findOne).toHaveBeenCalledWith(999);
    });
  });

  describe('update', () => {
    it('should update an orcamento', async () => {
      const updateOrcamentoDto: OrcamentoUpdateInputDto = {
        nome: 'Orçamento A Atualizado',
        valor_inicial: '1300.00',
      };

      const updatedOrcamento: OrcamentoUpdateInputDto = { 
        nome: 'Orçamento A Atualizado', 
        valor_inicial: '1000.00', 
      };

      mockOrcamentosService.update.mockResolvedValue(updatedOrcamento);

      const result = await controller.update('1', updateOrcamentoDto);

      expect(result).toEqual(updatedOrcamento);
      expect(service.update).toHaveBeenCalledWith(1, updateOrcamentoDto);
    });
  });

  describe('remove', () => {
    it('should perform a soft delete of an orcamento', async () => {
      const orcamentoToDelete = { id: 1, nome: 'Orçamento A', valor_inicial: '1000.00' };

      mockOrcamentosService.softDelete.mockResolvedValue(orcamentoToDelete);

      const result = await controller.remove('1');

      expect(result).toEqual(orcamentoToDelete);
      expect(service.softDelete).toHaveBeenCalledWith(1);
    });
  });
});

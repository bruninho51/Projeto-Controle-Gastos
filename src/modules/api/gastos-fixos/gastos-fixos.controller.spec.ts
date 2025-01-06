import { Test, TestingModule } from '@nestjs/testing';
import { GastosFixosController } from './gastos-fixos.controller';
import { GastosFixosService } from './gastos-fixos.service';

describe('GastosFixosController', () => {
  let controller: GastosFixosController;
  let service: GastosFixosService;


  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GastosFixosController],
      providers: [
        {
          provide: GastosFixosService,
          useValue: {
            findAll: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            softDelete: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<GastosFixosController>(GastosFixosController);
    service = module.get<GastosFixosService>(GastosFixosService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

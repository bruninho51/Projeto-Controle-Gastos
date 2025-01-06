import { Test, TestingModule } from '@nestjs/testing';
import { GastosFixosService } from './gastos-fixos.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('GastosFixosService', () => {
  let service: GastosFixosService;
  let prismaService: PrismaService;

  const prismaServiceMock = {
    categoriaGasto: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GastosFixosService,
        {
          provide: PrismaService,
          useValue: prismaServiceMock,
        },
      ],
    }).compile();

    service = module.get<GastosFixosService>(GastosFixosService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from './prisma.service';

describe('PrismaService', () => {
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrismaService,
     
      ],
    }).compile();

    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(prismaService).toBeDefined();
  });

  describe('onModuleInit', () => {
    it('should call $connect on PrismaClient when the module is initialized', async () => {
      const $connect = jest.spyOn(prismaService, '$connect');
      
      await prismaService.onModuleInit();

      expect($connect).toHaveBeenCalled();
    });
  });

  describe('onModuleDestroy', () => {
    it('should call $disconnect on PrismaClient when the module is destroyed', async () => {
      const $disconnect = jest.spyOn(prismaService, '$disconnect');
      
      await prismaService.onModuleDestroy();

      expect($disconnect).toHaveBeenCalled();
    });
  });
});

import { Test, TestingModule } from "@nestjs/testing";
import { PadroesNotificacoesBancariasController } from "./padroes-notificacoes-bancarias.controller";
import { PadroesNotificacoesBancariasService } from "./padroes-notificacoes-bancarias.service";
import { PadraoNotificacaoBancariaCreateDto } from "./dtos/PadraoNotificacaoBancariaCreate.dto";
import { PadraoNotificacaoBancariaFindDto } from "./dtos/PadraoNotificacaoBancariaFind.dto";
import {
  InstituicaoFinanceira,
  PadraoNotificacaoBancaria,
} from "@prisma/client";

describe("PadroesNotificacoesBancariasController", () => {
  let controller: PadroesNotificacoesBancariasController;
  let service: PadroesNotificacoesBancariasService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PadroesNotificacoesBancariasController],
      providers: [
        {
          provide: PadroesNotificacoesBancariasService,
          useValue: {
            obterOuGerar: jest.fn().mockResolvedValue(null),
            findAll: jest.fn().mockResolvedValue([]),
          },
        },
      ],
    }).compile();

    controller = module.get<PadroesNotificacoesBancariasController>(
      PadroesNotificacoesBancariasController,
    );
    service = module.get<PadroesNotificacoesBancariasService>(
      PadroesNotificacoesBancariasService,
    );
  });

  describe("obterOuGerar", () => {
    it("should delegate to the service and return its result", async () => {
      const createDto: PadraoNotificacaoBancariaCreateDto = {
        instituicao_financeira: InstituicaoFinanceira.ITAU,
        titulo_notificacao: "Compra aprovada",
        corpo_notificacao: "Compra de R$ 59,90 em MERCADO SAO JOAO aprovada.",
      };

      const result = {
        id: 1,
        ...createDto,
      } as unknown as PadraoNotificacaoBancaria;
      jest.spyOn(service, "obterOuGerar").mockResolvedValue(result as never);

      expect(await controller.obterOuGerar(createDto)).toBe(result);
      expect(service.obterOuGerar).toHaveBeenCalledWith(createDto);
    });
  });

  describe("findAll", () => {
    it("should delegate to the service and return its result", async () => {
      const filters: PadraoNotificacaoBancariaFindDto = {
        instituicao_financeira: InstituicaoFinanceira.ITAU,
      };

      const result = [{ id: 1 }] as PadraoNotificacaoBancaria[];
      jest.spyOn(service, "findAll").mockResolvedValue(result as never);

      expect(await controller.findAll(filters)).toBe(result);
      expect(service.findAll).toHaveBeenCalledWith(filters);
    });
  });
});

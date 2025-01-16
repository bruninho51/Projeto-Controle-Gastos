import { Test, TestingModule } from "@nestjs/testing";
import { LinhaDoTempoInvestimentosController } from "./linha-do-tempo-investimentos.controller";

describe("LinhaDoTempoInvestimentosController", () => {
  let controller: LinhaDoTempoInvestimentosController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LinhaDoTempoInvestimentosController],
    }).compile();

    controller = module.get<LinhaDoTempoInvestimentosController>(
      LinhaDoTempoInvestimentosController,
    );
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });
});

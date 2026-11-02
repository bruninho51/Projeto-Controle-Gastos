import { Test, TestingModule } from "@nestjs/testing";
import { PrismaModule } from "../../src/modules/prisma/prisma.module";
import { PrismaService } from "../../src/modules/prisma/prisma.service";
import { runPrismaMigrations } from "../utils/run-prisma-migrations";
import { faker } from "@faker-js/faker";
import { TipoCategoriaGasto } from "@prisma/client";

jest.setTimeout(30000);

interface GastoAtivoRow {
  gasto_id: number;
  gasto_tipo: string;
  categoria_tipo: TipoCategoriaGasto;
}

describe("vw_gastos_ativos (e2e)", () => {
  let module: TestingModule;
  let prisma: PrismaService;
  let usuarioId: number;
  let orcamentoId: number;

  async function criarCategoria(tipo: TipoCategoriaGasto) {
    return prisma.categoriaGasto.create({
      data: {
        nome: faker.string.alphanumeric(10),
        tipo,
        usuario_id: usuarioId,
      },
    });
  }

  async function buscarNaView(orcId: number) {
    return prisma.$queryRaw<GastoAtivoRow[]>`
      SELECT gasto_id, gasto_tipo, categoria_tipo
      FROM vw_gastos_ativos
      WHERE orcamento_id = ${orcId}
      ORDER BY gasto_tipo, gasto_id`;
  }

  beforeAll(async () => {
    await runPrismaMigrations();

    module = await Test.createTestingModule({
      imports: [PrismaModule],
    }).compile();
    await module.init();

    prisma = module.get<PrismaService>(PrismaService);

    const usuario = await prisma.usuario.create({
      data: {
        email: faker.internet.email(),
        nome: faker.person.fullName(),
        google_id: faker.string.uuid(),
      },
    });
    usuarioId = usuario.id;
  });

  beforeEach(async () => {
    const orcamento = await prisma.orcamento.create({
      data: {
        nome: faker.string.alphanumeric(8),
        valor_inicial: "1000",
        usuario_id: usuarioId,
      },
    });
    orcamentoId = orcamento.id;
  });

  afterAll(async () => {
    await module.close();
  });

  it("should expose categoria_tipo for gastos fixos and variados", async () => {
    const despesa = await criarCategoria(TipoCategoriaGasto.DESPESA);
    const patrimonio = await criarCategoria(TipoCategoriaGasto.PATRIMONIO);

    const fixo = await prisma.gastoFixo.create({
      data: {
        descricao: "Aluguel",
        previsto: "500",
        categoria_id: despesa.id,
        orcamento_id: orcamentoId,
      },
    });
    const variado = await prisma.gastoVariado.create({
      data: {
        descricao: "Aporte",
        valor: "100",
        data_pgto: new Date(),
        categoria_id: patrimonio.id,
        orcamento_id: orcamentoId,
      },
    });

    const rows = await buscarNaView(orcamentoId);

    expect(rows).toEqual([
      {
        gasto_id: fixo.id,
        gasto_tipo: "fixo",
        categoria_tipo: TipoCategoriaGasto.DESPESA,
      },
      {
        gasto_id: variado.id,
        gasto_tipo: "variado",
        categoria_tipo: TipoCategoriaGasto.PATRIMONIO,
      },
    ]);
  });

  it("should default categoria_tipo to DESPESA when tipo is not informed", async () => {
    const categoria = await prisma.categoriaGasto.create({
      data: { nome: faker.string.alphanumeric(10), usuario_id: usuarioId },
    });
    await prisma.gastoVariado.create({
      data: {
        descricao: "Mercado",
        valor: "50",
        data_pgto: new Date(),
        categoria_id: categoria.id,
        orcamento_id: orcamentoId,
      },
    });

    const rows = await buscarNaView(orcamentoId);

    expect(rows).toHaveLength(1);
    expect(rows[0].categoria_tipo).toBe(TipoCategoriaGasto.DESPESA);
  });

  it("should not list soft deleted gastos", async () => {
    const patrimonio = await criarCategoria(TipoCategoriaGasto.PATRIMONIO);
    await prisma.gastoVariado.create({
      data: {
        descricao: "Removido",
        valor: "10",
        data_pgto: new Date(),
        soft_delete: new Date(),
        categoria_id: patrimonio.id,
        orcamento_id: orcamentoId,
      },
    });

    expect(await buscarNaView(orcamentoId)).toEqual([]);
  });
});

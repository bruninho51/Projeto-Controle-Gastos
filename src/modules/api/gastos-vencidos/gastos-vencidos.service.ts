import { Inject, Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { GastoVencidoResponseDto } from "./dtos/GastoVencidoResponse.dto";

@Injectable()
export class GastosVencidosService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async findGastosAVencer(): Promise<GastoVencidoResponseDto[]> {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const em3Dias = new Date(hoje);
    em3Dias.setDate(em3Dias.getDate() + 3);
    em3Dias.setHours(23, 59, 59, 999);

    const gastos = await this.prisma.gastoFixo.findMany({
      where: {
        soft_delete: null,
        data_pgto: null,
        data_venc: {
          lte: em3Dias, // vencidos no passado + vencendo nos próximos 3 dias
        },
        orcamento: {
          soft_delete: null,
          data_encerramento: null,
        },
      },
      include: {
        orcamento: {
          include: {
            usuario: {
              include: {
                tokenDispositivos: true,
              },
            },
          },
        },
      },
    });

    return gastos.map((g) => GastoVencidoResponseDto.fromEntity(g));
  }
}

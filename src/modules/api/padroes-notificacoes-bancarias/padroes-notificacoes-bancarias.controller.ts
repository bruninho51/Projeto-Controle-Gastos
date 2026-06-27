import { Controller, Get, Post, Body, Query, UseGuards } from "@nestjs/common";
import { PadroesNotificacoesBancariasService as PadroesNotificacoesBancariasService } from "./padroes-notificacoes-bancarias.service";
import { PadraoNotificacaoBancariaCreateDto } from "./dtos/PadraoNotificacaoBancariaCreate.dto";
import { PadraoNotificacaoBancariaFindDto } from "./dtos/PadraoNotificacaoBancariaFind.dto";
import { PadraoNotificacaoBancariaResponseDto } from "./dtos/PadraoNotificacaoBancariaResponse.dto";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiBody,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";

@ApiTags("Regex de Notificações Bancárias")
@ApiBearerAuth("access-token")
@ApiUnauthorizedResponse({
  description: "Token inválido ou não informado",
})
@ApiResponse({ status: 500, description: "Erro interno no servidor." })
@UseGuards(JwtAuthGuard)
@Controller("padroes-notificacoes-bancarias")
export class PadroesNotificacoesBancariasController {
  constructor(
    private readonly regexNotificacoesBancariasService: PadroesNotificacoesBancariasService,
  ) {}

  @Post()
  @ApiOperation({
    summary: "Obter ou gerar a regex de extração de uma notificação bancária",
    description:
      "Retorna a regex já cadastrada para a combinação de instituição financeira e título, caso ainda esteja válida. Caso contrário, gera uma nova regex utilizando o Gemini, atualizando o registro existente sem duplicá-lo.",
  })
  @ApiBody({ type: PadraoNotificacaoBancariaCreateDto })
  @ApiResponse({
    status: 201,
    description: "Regex obtida ou gerada com sucesso.",
    type: PadraoNotificacaoBancariaResponseDto,
  })
  @ApiResponse({
    status: 502,
    description: "Falha ao gerar a regex através do serviço do Gemini.",
  })
  async obterOuGerar(
    @Body() createDto: PadraoNotificacaoBancariaCreateDto,
  ): Promise<PadraoNotificacaoBancariaResponseDto> {
    return this.regexNotificacoesBancariasService.obterOuGerar(createDto);
  }

  @Get()
  @ApiOperation({
    summary: "Listar as regex de notificações bancárias cadastradas",
    description:
      "Os filtros por instituição financeira e título são opcionais e podem ser usados isoladamente, em conjunto ou nenhum. Registros expirados também são retornados.",
  })
  @ApiResponse({
    status: 200,
    description: "Lista de regex de notificações bancárias",
    type: PadraoNotificacaoBancariaResponseDto,
    isArray: true,
  })
  async findAll(
    @Query() filters: PadraoNotificacaoBancariaFindDto,
  ): Promise<PadraoNotificacaoBancariaResponseDto[]> {
    return this.regexNotificacoesBancariasService.findAll(filters);
  }
}

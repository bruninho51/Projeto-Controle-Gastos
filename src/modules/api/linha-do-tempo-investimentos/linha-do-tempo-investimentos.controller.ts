import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Req,
} from "@nestjs/common";
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { LinhaDoTempoInvestimentosService } from "./linha-do-tempo-investimentos.service";
import { RegistroInvestimentoLinhaDoTempoCreateDto } from "./dtos/RegistroInvestimentoLinhaDoTempoCreate.dto";
import { RegistroInvestimentoLinhaDoTempoUpdateDto } from "./dtos/RegistroInvestimentoLinhaDoTempoUpdate.dto";
import { InvestimentosService } from "../investimentos/investimentos.service";

@ApiTags("Linha do Tempo Investimentos")
@Controller("investimentos/:investimento_id/linha-do-tempo")
export class LinhaDoTempoInvestimentosController {
  constructor(
    private readonly linhaDoTempoService: LinhaDoTempoInvestimentosService,
    private readonly investimentoService: InvestimentosService,
  ) {}

  @Post()
  @ApiOperation({ summary: "Criar um novo registro na linha do tempo" })
  @ApiBody({ type: RegistroInvestimentoLinhaDoTempoCreateDto })
  @ApiResponse({
    status: 201,
    description: "Registro de linha do tempo criado com sucesso.",
  })
  @ApiResponse({ status: 500, description: "Erro interno no servidor." })
  async create(
    @Req() { user }, 
    @Param("investimento_id") investimento_id: String,
    @Body()
    createRegistroLinhaDoTempoDto: RegistroInvestimentoLinhaDoTempoCreateDto,
  ) {
    const investimento =
      await this.investimentoService.findOne(user.id, +investimento_id);

    if (!investimento) {
      throw new NotFoundException(
        "O investimento informado não foi encontrado.",
      );
    }

    return this.linhaDoTempoService.create(
      investimento.id,
      createRegistroLinhaDoTempoDto,
    );
  }

  @Get()
  @ApiOperation({
    summary: "Buscar todos os registros de linha do tempo do investimento",
  })
  @ApiResponse({
    status: 200,
    description: "Lista de lançamentos na linha do tempo.",
  })
  @ApiResponse({ status: 500, description: "Erro interno no servidor." })
  async findAll(@Req() { user }, @Param("investimento_id") investimento_id: string) {
    const investimento =
      await this.investimentoService.findOne(user.id, +investimento_id);

    if (!investimento) {
      throw new NotFoundException(
        "O investimento informado não foi encontrado.",
      );
    }

    return this.linhaDoTempoService.findAll(investimento.id);
  }

  @Get(":id")
  @ApiOperation({ summary: "Buscar um registro de linha do tempo pelo ID" })
  @ApiParam({
    name: "id",
    type: "string",
    description: "ID do registro de linha do tempo",
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: "Registro de linha do tempo encontrado.",
  })
  @ApiResponse({
    status: 404,
    description: "Registro de linha do tempo não encontrado.",
  })
  @ApiResponse({ status: 500, description: "Erro interno no servidor." })
  async findOne(
    @Req() { user }, 
    @Param("investimento_id") investimento_id: string,
    @Param("id") id: string,
  ) {
    const investimento =
      await this.investimentoService.findOne(user.id, +investimento_id);

    if (!investimento) {
      throw new NotFoundException(
        "O investimento informado não foi encontrado.",
      );
    }

    return this.linhaDoTempoService.findOne(+investimento_id, +id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Atualizar um registro de linha do tempo" })
  @ApiParam({
    name: "id",
    type: "string",
    description: "ID do registro de linha do tempo",
    required: true,
  })
  @ApiBody({ type: RegistroInvestimentoLinhaDoTempoUpdateDto })
  @ApiResponse({
    status: 200,
    description: "Registro de linha do tempo atualizado com sucesso.",
  })
  @ApiResponse({
    status: 404,
    description: "Registro de linha do tempo não encontrado.",
  })
  @ApiResponse({ status: 500, description: "Erro interno no servidor." })
  async update(
    @Req() { user }, 
    @Param("investimento_id") investimento_id: string,
    @Param("id") id: string,
    @Body()
    updateRegistroLinhaDoTempoDto: RegistroInvestimentoLinhaDoTempoUpdateDto,
  ) {
    const investimento =
      await this.investimentoService.findOne(user.id, +investimento_id);

    if (!investimento) {
      throw new NotFoundException(
        "O investimento informado não foi encontrado.",
      );
    }

    return this.linhaDoTempoService.update(
      investimento.id,
      +id,
      updateRegistroLinhaDoTempoDto,
    );
  }

  @Delete(":id")
  @ApiOperation({ summary: "Remover um registro de linha do tempo" })
  @ApiParam({
    name: "id",
    type: "string",
    description: "ID do registro de linha do tempo",
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: "Registro de linha do tempo removido com sucesso.",
  })
  @ApiResponse({
    status: 404,
    description: "Registro de linha do tempo não encontrado.",
  })
  @ApiResponse({ status: 500, description: "Erro interno no servidor." })
  async remove(
    @Req() { user }, 
    @Param("investimento_id") investimento_id: string,
    @Param("id") id: string,
  ) {
    const investimento =
      await this.investimentoService.findOne(user.id, +investimento_id);

    if (!investimento) {
      throw new NotFoundException(
        "O investimento informado não foi encontrado.",
      );
    }

    return this.linhaDoTempoService.softDelete(investimento.id, +id);
  }
}

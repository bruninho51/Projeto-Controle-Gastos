import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  NotFoundException,
  Req,
} from "@nestjs/common";
import { GastosVariadosService } from "./gastos-variados.service";
import { GastoVariadoCreateDto } from "./dtos/GastoVariadoCreate.dto";
import { GastoVariadoUpdateDto } from "./dtos/GastoVariadoUpdate.dto";
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { OrcamentosService } from "../orcamentos/orcamentos.service";
import { CategoriasGastosService } from "../categorias-gastos/categorias-gastos.service";

@ApiTags("Gastos Variados")
@Controller("orcamentos/:orcamento_id/gastos-variados")
export class GastosVariadosController {
  constructor(
    private readonly gastosVariadosService: GastosVariadosService,
    private readonly orcamentosService: OrcamentosService,
    private readonly categoriaGastosService: CategoriasGastosService,
  ) {}

  @Post()
  @ApiOperation({ summary: "Criar um novo gasto variado" })
  @ApiBody({ type: GastoVariadoCreateDto })
  @ApiResponse({
    status: 201,
    description: "Gasto variado criado com sucesso.",
  })
  @ApiResponse({ status: 500, description: "Erro interno no servidor." })
  async create(
    @Req() { user }, 
    @Param("orcamento_id") orcamento_id: String,
    @Body() createGastoDto: GastoVariadoCreateDto,
  ) {
    const orcamento = await this.orcamentosService.findOne(user.id, +orcamento_id);
    const categoriaGasto = await this.categoriaGastosService.findOne(
      user.id,
      createGastoDto.categoria_id,
    );

    if (!categoriaGasto) {
      throw new NotFoundException("A categoria informada não foi encontrada.");
    }

    if (!orcamento) {
      throw new NotFoundException("O orçamento informado não foi encontrado.");
    }

    return this.gastosVariadosService.create(orcamento.id, createGastoDto);
  }

  @Get()
  @ApiOperation({ summary: "Buscar todos os gastos variados" })
  @ApiResponse({ status: 200, description: "Lista de gastos variados." })
  @ApiResponse({ status: 500, description: "Erro interno no servidor." })
  async findAll(@Req() { user }, @Param("orcamento_id") orcamento_id: string) {
    const orcamento = await this.orcamentosService.findOne(user.id, +orcamento_id);

    if (!orcamento) {
      throw new NotFoundException("O orçamento informado não foi encontrado.");
    }

    return this.gastosVariadosService.findAll(orcamento.id);
  }

  @Get(":id")
  @ApiOperation({ summary: "Buscar um gasto variado pelo ID" })
  @ApiParam({
    name: "id",
    type: "string",
    description: "ID do gasto variado",
    required: true,
  })
  @ApiResponse({ status: 200, description: "Gasto variado encontrado." })
  @ApiResponse({ status: 404, description: "Gasto variado não encontrado." })
  @ApiResponse({ status: 500, description: "Erro interno no servidor." })
  async findOne(
    @Req() { user }, 
    @Param("orcamento_id") orcamento_id: string,
    @Param("id") id: string,
  ) {
    const orcamento = await this.orcamentosService.findOne(user.id, +orcamento_id);

    if (!orcamento) {
      throw new NotFoundException("O orçamento informado não foi encontrado.");
    }

    return this.gastosVariadosService.findOne(orcamento.id, +id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Atualizar um gasto variado" })
  @ApiParam({
    name: "id",
    type: "string",
    description: "ID do gasto variado",
    required: true,
  })
  @ApiBody({ type: GastoVariadoUpdateDto })
  @ApiResponse({
    status: 200,
    description: "Gasto variado atualizado com sucesso.",
  })
  @ApiResponse({ status: 404, description: "Gasto variado não encontrado." })
  @ApiResponse({ status: 500, description: "Erro interno no servidor." })
  async update(
    @Req() { user }, 
    @Param("orcamento_id") orcamento_id: string,
    @Param("id") id: string,
    @Body() updateGastoDto: GastoVariadoUpdateDto,
  ) {
    const orcamento = await this.orcamentosService.findOne(user.id, +orcamento_id);

    if (!orcamento) {
      throw new NotFoundException("O orçamento informado não foi encontrado.");
    }

    return this.gastosVariadosService.update(orcamento.id, +id, updateGastoDto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Remover um gasto variado" })
  @ApiParam({
    name: "id",
    type: "string",
    description: "ID do gasto variado",
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: "Gasto variado removido com sucesso.",
  })
  @ApiResponse({ status: 404, description: "Gasto variado não encontrado." })
  @ApiResponse({ status: 500, description: "Erro interno no servidor." })
  async remove(
    @Req() { user }, 
    @Param("orcamento_id") orcamento_id: string,
    @Param("id") id: string,
  ) {
    const orcamento = await this.orcamentosService.findOne(user.id, +orcamento_id);

    if (!orcamento) {
      throw new NotFoundException("O orçamento informado não foi encontrado.");
    }

    return this.gastosVariadosService.softDelete(orcamento.id, +id);
  }
}

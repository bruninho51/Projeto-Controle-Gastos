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
  UseGuards,
} from "@nestjs/common";
import { GastosFixosService } from "./gastos-fixos.service";
import { GastoFixoCreateDto } from "./dtos/GastoFixoCreate.dto";
import { GastoFixoUpdateDto } from "./dtos/GastoFixoUpdate.dto";
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { OrcamentosService } from "../orcamentos/orcamentos.service";
import { CategoriasGastosService } from "../categorias-gastos/categorias-gastos.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";

@ApiTags("Gastos Fixos")
@Controller("orcamentos/:orcamento_id/gastos-fixos")
export class GastosFixosController {
  constructor(
    private readonly gastosFixosService: GastosFixosService,
    private readonly orcamentosService: OrcamentosService,
    private readonly categoriaGastosService: CategoriasGastosService,
  ) {}

  @Post()
  @ApiOperation({ summary: "Criar um novo gasto fixo" })
  @ApiBody({ type: GastoFixoCreateDto })
  @ApiResponse({ status: 201, description: "Gasto fixo criado com sucesso." })
  @ApiResponse({ status: 500, description: "Erro interno no servidor." })
  @ApiBearerAuth('access-token')
    @UseGuards(JwtAuthGuard)
  async create(
    @Req() { user },
    @Param("orcamento_id") orcamento_id: String,
    @Body() createGastoDto: GastoFixoCreateDto,
  ) {
    const orcamento = await this.orcamentosService.findOne(
      user.id,
      +orcamento_id,
    );
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

    return this.gastosFixosService.create(orcamento.id, createGastoDto);
  }

  @Get()
  @ApiOperation({ summary: "Buscar todos os gastos fixos" })
  @ApiResponse({ status: 200, description: "Lista de gastos fixos." })
  @ApiResponse({ status: 500, description: "Erro interno no servidor." })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  async findAll(@Req() { user }, @Param("orcamento_id") orcamento_id: string) {
    const orcamento = await this.orcamentosService.findOne(
      user.id,
      +orcamento_id,
    );

    if (!orcamento) {
      throw new NotFoundException("O orçamento informado não foi encontrado.");
    }

    return this.gastosFixosService.findAll(orcamento.id);
  }

  @Get(":id")
  @ApiOperation({ summary: "Buscar um gasto fixo pelo ID" })
  @ApiParam({
    name: "id",
    type: "string",
    description: "ID do gasto fixo",
    required: true,
  })
  @ApiResponse({ status: 200, description: "Gasto fixo encontrado." })
  @ApiResponse({ status: 404, description: "Gasto fixo não encontrado." })
  @ApiResponse({ status: 500, description: "Erro interno no servidor." })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  async findOne(
    @Req() { user },
    @Param("orcamento_id") orcamento_id: string,
    @Param("id") id: string,
  ) {
    const orcamento = await this.orcamentosService.findOne(
      user.id,
      +orcamento_id,
    );

    if (!orcamento) {
      throw new NotFoundException("O orçamento informado não foi encontrado.");
    }

    return this.gastosFixosService.findOne(orcamento.id, +id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Atualizar um gasto fixo" })
  @ApiParam({
    name: "id",
    type: "string",
    description: "ID do gasto fixo",
    required: true,
  })
  @ApiBody({ type: GastoFixoUpdateDto })
  @ApiResponse({
    status: 200,
    description: "Gasto fixo atualizado com sucesso.",
  })
  @ApiResponse({ status: 404, description: "Gasto fixo não encontrado." })
  @ApiResponse({ status: 500, description: "Erro interno no servidor." })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  async update(
    @Req() { user },
    @Param("orcamento_id") orcamento_id: string,
    @Param("id") id: string,
    @Body() updateGastoDto: GastoFixoUpdateDto,
  ) {
    const orcamento = await this.orcamentosService.findOne(
      user.id,
      +orcamento_id,
    );

    if (!orcamento) {
      throw new NotFoundException("O orçamento informado não foi encontrado.");
    }

    return this.gastosFixosService.update(orcamento.id, +id, updateGastoDto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Remover um gasto fixo" })
  @ApiParam({
    name: "id",
    type: "string",
    description: "ID do gasto fixo",
    required: true,
  })
  @ApiResponse({ status: 200, description: "Gasto fixo removido com sucesso." })
  @ApiResponse({ status: 404, description: "Gasto fixo não encontrado." })
  @ApiResponse({ status: 500, description: "Erro interno no servidor." })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  async remove(
    @Req() { user },
    @Param("orcamento_id") orcamento_id: string,
    @Param("id") id: string,
  ) {
    const orcamento = await this.orcamentosService.findOne(
      user.id,
      +orcamento_id,
    );

    if (!orcamento) {
      throw new NotFoundException("O orçamento informado não foi encontrado.");
    }

    return this.gastosFixosService.softDelete(orcamento.id, +id);
  }
}

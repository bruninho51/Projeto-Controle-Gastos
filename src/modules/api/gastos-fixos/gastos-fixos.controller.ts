import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
} from "@nestjs/common";
import { GastosFixosService } from "./gastos-fixos.service";
import { GastoFixoCreateDto } from "./dtos/GastoFixoCreate.dto";
import { GastoFixoUpdateDto } from "./dtos/GastoFixoUpdate.dto";
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";

@ApiTags("Gastos Fixos")
@Controller("orcamentos/:orcamento_id/gastos-fixos")
export class GastosFixosController {
  constructor(private readonly gastosFixosService: GastosFixosService) {}

  @Post()
  @ApiOperation({ summary: "Criar um novo gasto fixo" })
  @ApiBody({ type: GastoFixoCreateDto })
  @ApiResponse({ status: 201, description: "Gasto fixo criado com sucesso." })
  @ApiResponse({ status: 500, description: "Erro interno no servidor." })
  create(
    @Param("orcamento_id") orcamento_id: String,
    @Body() createGastoDto: GastoFixoCreateDto,
  ) {
    return this.gastosFixosService.create(+orcamento_id, createGastoDto);
  }

  @Get()
  @ApiOperation({ summary: "Buscar todos os gastos fixos" })
  @ApiResponse({ status: 200, description: "Lista de gastos fixos." })
  @ApiResponse({ status: 500, description: "Erro interno no servidor." })
  findAll(@Param("orcamento_id") orcamento_id: string) {
    return this.gastosFixosService.findAll(+orcamento_id);
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
  findOne(
    @Param("orcamento_id") orcamento_id: string,
    @Param("id") id: string,
  ) {
    return this.gastosFixosService.findOne(+orcamento_id, +id);
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
  update(
    @Param("orcamento_id") orcamento_id: string,
    @Param("id") id: string,
    @Body() updateGastoDto: GastoFixoUpdateDto,
  ) {
    return this.gastosFixosService.update(+orcamento_id, +id, updateGastoDto);
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
  remove(@Param("orcamento_id") orcamento_id: string, @Param("id") id: string) {
    return this.gastosFixosService.softDelete(+orcamento_id, +id);
  }
}

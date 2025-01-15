import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from "@nestjs/common";
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { InvestimentoCreateDto } from "./dtos/InvestimentoCreate.dto";
import { InvestimentosService } from "./investimentos.service";
import { InvestimentoUpdateDto } from "./dtos/InvestimentoUpdate.dto";

@ApiTags("Investimentos")
@Controller("investimentos")
export class InvestimentosController {
  constructor(private readonly investimentosService: InvestimentosService) {}

  @Post()
  @ApiOperation({ summary: "Criar um novo investimento" })
  @ApiBody({ type: InvestimentoCreateDto })
  @ApiResponse({ status: 201, description: "Investimento criado com sucesso." })
  @ApiResponse({ status: 500, description: "Erro interno no servidor." })
  create(@Body() createInvestimentoDto: InvestimentoCreateDto) {
    return this.investimentosService.create(createInvestimentoDto);
  }

  @Get()
  @ApiOperation({ summary: "Buscar todos os investimentos" })
  @ApiResponse({ status: 200, description: "Lista de investimentos." })
  @ApiResponse({ status: 500, description: "Erro interno no servidor." })
  findAll() {
    return this.investimentosService.findAll();
  }

  @Get(":id")
  @ApiOperation({ summary: "Buscar um investimento pelo ID" })
  @ApiParam({
    name: "id",
    type: "string",
    description: "ID do investimento",
    required: true,
  })
  @ApiResponse({ status: 200, description: "Investimento encontrado." })
  @ApiResponse({ status: 404, description: "Investimento não encontrado." })
  @ApiResponse({ status: 500, description: "Erro interno no servidor." })
  async findOne(@Param("id") id: string) {
    return this.investimentosService.findOne(+id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Atualizar um investimento" })
  @ApiParam({
    name: "id",
    type: "string",
    description: "ID do investimento",
    required: true,
  })
  @ApiBody({ type: InvestimentoUpdateDto })
  @ApiResponse({
    status: 200,
    description: "Investimento atualizado com sucesso.",
  })
  @ApiResponse({ status: 404, description: "Investimento não encontrado." })
  @ApiResponse({ status: 500, description: "Erro interno no servidor." })
  update(
    @Param("id") id: string,
    @Body() updateInvestimentoDto: InvestimentoUpdateDto,
  ) {
    return this.investimentosService.update(+id, updateInvestimentoDto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Remover um investimento" })
  @ApiParam({
    name: "id",
    type: "string",
    description: "ID do investimento",
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: "Investimento removido com sucesso.",
  })
  @ApiResponse({ status: 404, description: "Investimento não encontrado." })
  @ApiResponse({ status: 500, description: "Erro interno no servidor." })
  remove(@Param("id") id: string) {
    return this.investimentosService.softDelete(+id);
  }
}

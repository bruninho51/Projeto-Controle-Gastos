import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Patch,
  Req,
  UseGuards,
  ParseIntPipe,
  Query,
} from "@nestjs/common";
import { OrcamentosService } from "./orcamentos.service";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { OrcamentoCreateDto } from "./dtos/OrcamentoCreate.dto";
import { OrcamentoUpdateDto } from "./dtos/OrcamentoUpdate.dto";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { OrcamentoResponseDto } from "./dtos/OrcamentoResponse.dto";
import { OrcamentoFindDto } from "./dtos/OrcamentoFind.dto";

@ApiTags("Orçamentos")
@ApiBearerAuth("access-token")
@ApiUnauthorizedResponse({
  description: "Token inválido ou não informado",
})
@ApiResponse({ status: 500, description: "Erro interno no servidor." })
@UseGuards(JwtAuthGuard)
@Controller("orcamentos")
export class OrcamentosController {
  constructor(private readonly orcamentoService: OrcamentosService) {}

  @Post()
  @ApiOperation({ summary: "Criar um novo orçamento" })
  @ApiBody({ type: OrcamentoCreateDto })
  @ApiResponse({
    status: 201,
    description: "Orçamento criado com sucesso.",
    type: OrcamentoResponseDto,
  })
  create(
    @Req() { user },
    @Body() createOrcamentoDto: OrcamentoCreateDto,
  ): Promise<OrcamentoResponseDto> {
    return this.orcamentoService.create(user.id, createOrcamentoDto);
  }

  @Get()
  @ApiOperation({ summary: "Buscar todos os orçamentos" })
  @ApiResponse({
    status: 200,
    description: "Lista de orçamentos.",
    type: OrcamentoResponseDto,
    isArray: true,
  })
  findAll(
    @Req() { user },
    @Query() query: OrcamentoFindDto,
  ): Promise<OrcamentoResponseDto[]> {
    return this.orcamentoService.findAll(user.id, query);
  }

  @Get(":id")
  @ApiOperation({ summary: "Buscar um orçamento pelo ID" })
  @ApiParam({
    name: "id",
    type: Number,
    description: "ID do orçamento",
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: "Orçamento encontrado.",
    type: OrcamentoResponseDto,
  })
  @ApiResponse({ status: 404, description: "Orçamento não encontrado." })
  async findOne(
    @Req() { user },
    @Param("id", ParseIntPipe) id: number,
  ): Promise<OrcamentoResponseDto> {
    return this.orcamentoService.findOne(user.id, id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Atualizar um orçamento" })
  @ApiParam({
    name: "id",
    type: Number,
    description: "ID do orçamento",
    required: true,
  })
  @ApiBody({ type: OrcamentoUpdateDto })
  @ApiResponse({
    status: 200,
    description: "Orçamento atualizado com sucesso.",
    type: OrcamentoResponseDto,
  })
  @ApiResponse({ status: 404, description: "Orçamento não encontrado." })
  update(
    @Req() { user },
    @Param("id", ParseIntPipe) id: number,
    @Body() updateOrcamentoDto: OrcamentoUpdateDto,
  ): Promise<OrcamentoResponseDto> {
    return this.orcamentoService.update(user.id, id, updateOrcamentoDto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Remover um orçamento" })
  @ApiParam({
    name: "id",
    type: Number,
    description: "ID do orçamento",
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: "Orçamento removido com sucesso.",
    type: OrcamentoResponseDto,
  })
  @ApiResponse({ status: 404, description: "Orçamento não encontrado." })
  remove(
    @Req() { user },
    @Param("id", ParseIntPipe) id: number,
  ): Promise<OrcamentoResponseDto> {
    return this.orcamentoService.softDelete(user.id, id);
  }
}

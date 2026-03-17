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
import { CategoriasGastosService } from "./categorias-gastos.service";
import { CategoriaGastoCreateDto } from "./dtos/CategoriaGastoCreate.dto";
import { CategoriaGastoUpdateDto } from "./dtos/CategoriaGastoUpdate.dto";
import { CategoriaGastoResponseDto } from "./dtos/CategoriaGastoResponse.dto";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiBody,
  ApiParam,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CategoriaGastoFindDto } from "./dtos/CategoriaGastoFind.dto";

@ApiTags("Categorias de Gastos")
@ApiBearerAuth("access-token")
@ApiUnauthorizedResponse({
  description: "Token inválido ou não informado",
})
@ApiResponse({ status: 500, description: "Erro interno no servidor." })
@UseGuards(JwtAuthGuard)
@Controller("categorias-gastos")
export class CategoriasGastosController {
  constructor(
    private readonly categoriasGastosService: CategoriasGastosService,
  ) {}

  @Get()
  @ApiOperation({ summary: "Listar todas as categorias de gastos" })
  @ApiResponse({
    status: 200,
    description: "Lista de categorias de gastos",
    type: CategoriaGastoResponseDto,
    isArray: true,
  })
  @ApiResponse({ status: 500, description: "Erro interno no servidor." })
  async findAll(
    @Req() { user },
    @Query() query: CategoriaGastoFindDto,
  ): Promise<CategoriaGastoResponseDto[]> {
    return this.categoriasGastosService.findAll(user.id, query);
  }

  @Post()
  @ApiOperation({ summary: "Criar uma nova categoria de gasto" })
  @ApiBody({ type: CategoriaGastoCreateDto })
  @ApiResponse({
    status: 201,
    description: "Categoria de gasto criada com sucesso.",
    type: CategoriaGastoResponseDto,
  })
  @ApiResponse({ status: 409, description: "Categoria de gasto já existe." })
  async create(
    @Req() { user },
    @Body() createCategoriaDto: CategoriaGastoCreateDto,
  ): Promise<CategoriaGastoResponseDto> {
    return this.categoriasGastosService.create(user.id, createCategoriaDto);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Atualizar uma categoria de gasto" })
  @ApiParam({
    name: "id",
    type: Number,
    description: "ID da categoria de gasto",
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: "Categoria de gasto atualizada com sucesso.",
    type: CategoriaGastoResponseDto,
  })
  @ApiResponse({ status: 409, description: "Categoria de gasto já existe." })
  @ApiResponse({ status: 404, description: "Categoria de gasto não existe." })
  async update(
    @Req() { user },
    @Param("id", ParseIntPipe) id: number,
    @Body() updateCategoriaDto: CategoriaGastoUpdateDto,
  ): Promise<CategoriaGastoResponseDto> {
    return this.categoriasGastosService.update(user.id, id, updateCategoriaDto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Deletar uma categoria de gasto (soft delete)" })
  @ApiParam({
    name: "id",
    type: Number,
    description: "ID da categoria de gasto",
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: "Categoria de gasto deletada com sucesso.",
    type: CategoriaGastoResponseDto,
  })
  @ApiResponse({ status: 404, description: "Categoria de gasto não existe." })
  async remove(
    @Req() { user },
    @Param("id", ParseIntPipe) id: number,
  ): Promise<CategoriaGastoResponseDto> {
    return this.categoriasGastosService.softDelete(user.id, id);
  }
}

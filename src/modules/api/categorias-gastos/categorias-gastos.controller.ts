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
} from "@nestjs/common";
import { CategoriasGastosService } from "./categorias-gastos.service";
import { CategoriaGastoCreateDto } from "./dtos/CategoriaGastoCreate.dto";
import { CategoriaGastoUpdateDto } from "./dtos/CategoriaGastoUpdate.dto";
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";

@ApiTags("Categorias de Gastos")
@Controller("categorias-gastos")
export class CategoriasGastosController {
  constructor(
    private readonly categoriasGastosService: CategoriasGastosService,
  ) {}

  @Get()
  @ApiOperation({ summary: "Listar todas as categorias de gastos" })
  @ApiResponse({ status: 200, description: "Lista de categorias de gastos" })
  @ApiResponse({ status: 500, description: "Erro interno no servidor." })
  @ApiBearerAuth('access-token')
    @UseGuards(JwtAuthGuard)
  async findAll(@Req() { user }) {
    return this.categoriasGastosService.findAll(user.id);
  }

  @Post()
  @ApiOperation({ summary: "Criar uma nova categoria de gasto" })
  @ApiResponse({
    status: 201,
    description: "Categoria de gasto criada com sucesso.",
  })
  @ApiResponse({ status: 409, description: "Categoria de gasto já existe." })
  @ApiResponse({ status: 500, description: "Erro interno no servidor." })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  async create(
    @Req() { user },
    @Body() createCategoriaDto: CategoriaGastoCreateDto,
  ) {
    return this.categoriasGastosService.create(user.id, createCategoriaDto);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Atualizar uma categoria de gasto" })
  @ApiResponse({
    status: 200,
    description: "Categoria de gasto atualizada com sucesso.",
  })
  @ApiResponse({ status: 409, description: "Categoria de gasto já existe." })
  @ApiResponse({ status: 404, description: "Categoria de gasto não existe." })
  @ApiResponse({ status: 500, description: "Erro interno no servidor." })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  async update(
    @Req() { user },
    @Param("id") id: number,
    @Body() updateCategoriaDto: CategoriaGastoUpdateDto,
  ) {
    return this.categoriasGastosService.update(user.id, id, updateCategoriaDto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Deletar uma categoria de gasto (soft delete)" })
  @ApiResponse({
    status: 200,
    description: "Categoria de gasto deletada com sucesso.",
  })
  @ApiResponse({ status: 404, description: "Categoria de gasto não existe." })
  @ApiResponse({ status: 500, description: "Erro interno no servidor." })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  async remove(@Req() { user }, @Param("id") id: number) {
    return this.categoriasGastosService.softDelete(user.id, id);
  }
}

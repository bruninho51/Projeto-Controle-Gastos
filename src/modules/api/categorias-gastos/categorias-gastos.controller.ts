import { Controller, Get, Post, Body, Param, Delete, Patch } from '@nestjs/common';
import { CategoriasGastosService } from './categorias-gastos.service';
import { CategoriaGastoCreateInputDto } from './dtos/CategoriaGastoCreateInput.dto';
import { CategoriaGastoUpdateInputDto } from './dtos/CategoriaGastoUpdateInput.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Categorias de Gastos')
@Controller('v1/categorias-gastos')
export class CategoriasGastosController {
  constructor(private readonly categoriasGastosService: CategoriasGastosService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todas as categorias de gastos' })
  @ApiResponse({ status: 200, description: 'Lista de categorias de gastos' })
  async findAll() {
    return this.categoriasGastosService.findAll();
  }

  @Post()
  @ApiOperation({ summary: 'Criar uma nova categoria de gasto' })
  @ApiResponse({ status: 201, description: 'Categoria de gasto criada com sucesso.' })
  async create(@Body() createCategoriaDto: CategoriaGastoCreateInputDto) {
    return this.categoriasGastosService.create(createCategoriaDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar uma categoria de gasto' })
  @ApiResponse({ status: 200, description: 'Categoria de gasto atualizada com sucesso.' })
  async update(@Param('id') id: number, @Body() updateCategoriaDto: CategoriaGastoUpdateInputDto) {
    return this.categoriasGastosService.update(id, updateCategoriaDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deletar uma categoria de gasto (soft delete)' })
  @ApiResponse({ status: 200, description: 'Categoria de gasto deletada com sucesso.' })
  async remove(@Param('id') id: number) {
    return this.categoriasGastosService.softDelete(id);
  }
}

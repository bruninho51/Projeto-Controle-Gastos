import { Controller, Get, Post, Body, Param, Patch, Delete } from '@nestjs/common';
import { GastosVariadosService } from './gastos-variados.service';
import { GastoVariadoCreateDto } from './dtos/GastoVariadoCreate.dto';
import { GastoVariadoUpdateDto } from './dtos/GastoVariadoUpdate.dto';
import { ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Gastos Variados') 
@Controller('orcamentos/:orcamento_id/gastos-variados')
export class GastosVariadosController {
  constructor(private readonly gastosVariadosService: GastosVariadosService) {}

  @Post()
  @ApiOperation({ summary: 'Criar um novo gasto variado' })
  @ApiBody({ type: GastoVariadoCreateDto })
  @ApiResponse({ status: 201, description: 'Gasto variado criado com sucesso.' })
  @ApiResponse({ status: 500, description: 'Erro interno no servidor.' })
  create(@Param("orcamento_id") orcamento_id: String,@Body() createGastoDto: GastoVariadoCreateDto) {
    return this.gastosVariadosService.create(+orcamento_id, createGastoDto);
  }

  @Get()
  @ApiOperation({ summary: 'Buscar todos os gastos variados' })
  @ApiResponse({ status: 200, description: 'Lista de gastos variados.' })
  @ApiResponse({ status: 500, description: 'Erro interno no servidor.' })
  findAll(@Param('orcamento_id') orcamento_id: string) {
    return this.gastosVariadosService.findAll(+orcamento_id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar um gasto variado pelo ID' })
  @ApiParam({ name: 'id', type: 'string', description: 'ID do gasto variado', required: true })
  @ApiResponse({ status: 200, description: 'Gasto variado encontrado.' })
  @ApiResponse({ status: 404, description: 'Gasto variado não encontrado.' })
  @ApiResponse({ status: 500, description: 'Erro interno no servidor.' })
  findOne(@Param('orcamento_id') orcamento_id: string, @Param('id') id: string) {
    return this.gastosVariadosService.findOne(+orcamento_id, +id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar um gasto variado' })
  @ApiParam({ name: 'id', type: 'string', description: 'ID do gasto variado', required: true })
  @ApiBody({ type: GastoVariadoUpdateDto })
  @ApiResponse({ status: 200, description: 'Gasto variado atualizado com sucesso.' })
  @ApiResponse({ status: 404, description: 'Gasto variado não encontrado.' })
  @ApiResponse({ status: 500, description: 'Erro interno no servidor.' })
  update(
    @Param('orcamento_id') orcamento_id: string,
    @Param('id') id: string, 
    @Body() updateGastoDto: GastoVariadoUpdateDto
  ) {
    return this.gastosVariadosService.update(+orcamento_id, +id, updateGastoDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover um gasto variado' })
  @ApiParam({ name: 'id', type: 'string', description: 'ID do gasto variado', required: true })
  @ApiResponse({ status: 200, description: 'Gasto variado removido com sucesso.' })
  @ApiResponse({ status: 404, description: 'Gasto variado não encontrado.' })
  @ApiResponse({ status: 500, description: 'Erro interno no servidor.' })
  remove(@Param('orcamento_id') orcamento_id: string, @Param('id') id: string) {
    return this.gastosVariadosService.softDelete(+orcamento_id, +id);
  }
}

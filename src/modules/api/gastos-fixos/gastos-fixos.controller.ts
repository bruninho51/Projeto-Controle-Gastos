import { Controller, Get, Post, Body, Param, Patch, Delete } from '@nestjs/common';
import { GastosFixosService } from './gastos-fixos.service';
import { GastoFixoCreateInputDto } from './dtos/GastoFixoCreateInput.dto';
import { GastoFixoUpdateInputDto } from './dtos/GastoFixoUpdateInput.dto';
import { ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Gastos Fixos') 
@Controller('gastos-fixos')
export class GastosFixosController {
  constructor(private readonly gastosFixosService: GastosFixosService) {}

  @Post()
  @ApiOperation({ summary: 'Criar um novo gasto fixo' })
  @ApiBody({ type: GastoFixoCreateInputDto })
  @ApiResponse({ status: 201, description: 'Gasto fixo criado com sucesso.' })
  @ApiResponse({ status: 500, description: 'Erro interno no servidor.' })
  create(@Body() createGastoDto: GastoFixoCreateInputDto) {
    return this.gastosFixosService.create(createGastoDto);
  }

  @Get()
  @ApiOperation({ summary: 'Buscar todos os gastos fixos' })
  @ApiResponse({ status: 200, description: 'Lista de gastos fixos.' })
  @ApiResponse({ status: 500, description: 'Erro interno no servidor.' })
  findAll() {
    return this.gastosFixosService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar um gasto fixo pelo ID' })
  @ApiParam({ name: 'id', type: 'string', description: 'ID do gasto fixo', required: true })
  @ApiResponse({ status: 200, description: 'Gasto fixo encontrado.' })
  @ApiResponse({ status: 404, description: 'Gasto fixo não encontrado.' })
  @ApiResponse({ status: 500, description: 'Erro interno no servidor.' })
  findOne(@Param('id') id: string) {
    return this.gastosFixosService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar um gasto fixo' })
  @ApiParam({ name: 'id', type: 'string', description: 'ID do gasto fixo', required: true })
  @ApiBody({ type: GastoFixoUpdateInputDto })
  @ApiResponse({ status: 200, description: 'Gasto fixo atualizado com sucesso.' })
  @ApiResponse({ status: 404, description: 'Gasto fixo não encontrado.' })
  @ApiResponse({ status: 500, description: 'Erro interno no servidor.' })
  update(
    @Param('id') id: string, 
    @Body() updateGastoDto: GastoFixoUpdateInputDto
  ) {
    return this.gastosFixosService.update(+id, updateGastoDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover um gasto fixo' })
  @ApiParam({ name: 'id', type: 'string', description: 'ID do gasto fixo', required: true })
  @ApiResponse({ status: 200, description: 'Gasto fixo removido com sucesso.' })
  @ApiResponse({ status: 404, description: 'Gasto fixo não encontrado.' })
  @ApiResponse({ status: 500, description: 'Erro interno no servidor.' })
  remove(@Param('id') id: string) {
    return this.gastosFixosService.softDelete(+id);
  }
}

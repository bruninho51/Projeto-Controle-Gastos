import { Controller, Get, Post, Body, Param, Delete, Patch } from '@nestjs/common';
import { OrcamentosService } from './orcamentos.service';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { OrcamentoCreateDto } from './dtos/OrcamentoCreate.dto';
import { OrcamentoUpdateDto } from './dtos/OrcamentoUpdate.dto';

@ApiTags('Orçamentos') 
@Controller('orcamentos')
export class OrcamentosController {
  constructor(private readonly orcamentoService: OrcamentosService) {}

  @Post()
  @ApiOperation({ summary: 'Criar um novo orçamento' })
  @ApiBody({ type: OrcamentoCreateDto })
  @ApiResponse({ status: 201, description: 'Orçamento criado com sucesso.' })
  @ApiResponse({ status: 500, description: 'Erro interno no servidor.' })
  create(@Body() createOrcamentoDto: OrcamentoCreateDto) {
    return this.orcamentoService.create(createOrcamentoDto);
  }

  @Get()
  @ApiOperation({ summary: 'Buscar todos os orçamentos' })
  @ApiResponse({ status: 200, description: 'Lista de orçamentos.' })
  @ApiResponse({ status: 500, description: 'Erro interno no servidor.' })
  findAll() {
    return this.orcamentoService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar um orçamento pelo ID' })
  @ApiParam({ name: 'id', type: 'string', description: 'ID do orçamento', required: true })
  @ApiResponse({ status: 200, description: 'Orçamento encontrado.' })
  @ApiResponse({ status: 404, description: 'Orçamento não encontrado.' })
  @ApiResponse({ status: 500, description: 'Erro interno no servidor.' })
  async findOne(@Param('id') id: string) {
    return this.orcamentoService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar um orçamento' })
  @ApiParam({ name: 'id', type: 'string', description: 'ID do orçamento', required: true })
  @ApiBody({ type: OrcamentoUpdateDto })
  @ApiResponse({ status: 200, description: 'Orçamento atualizado com sucesso.' })
  @ApiResponse({ status: 404, description: 'Orçamento não encontrado.' })
  @ApiResponse({ status: 500, description: 'Erro interno no servidor.' })
  update(
    @Param('id') id: string,
    @Body() updateOrcamentoDto: OrcamentoUpdateDto,
  ) {
    return this.orcamentoService.update(+id, updateOrcamentoDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover um orçamento' })
  @ApiParam({ name: 'id', type: 'string', description: 'ID do orçamento', required: true })
  @ApiResponse({ status: 200, description: 'Orçamento removido com sucesso.' })
  @ApiResponse({ status: 404, description: 'Orçamento não encontrado.' })
  @ApiResponse({ status: 500, description: 'Erro interno no servidor.' })
  remove(@Param('id') id: string) {
    return this.orcamentoService.softDelete(+id);
  }
}

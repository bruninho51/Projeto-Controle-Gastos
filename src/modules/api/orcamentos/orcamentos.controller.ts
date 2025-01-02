import { Controller, Get, Post, Body, Param, Delete, Patch } from '@nestjs/common';
import { OrcamentosService } from './orcamentos.service';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { OrcamentoCreateInputDto } from './dtos/OrcamentoCreateInput.dto';
import { OrcamentoUpdateInputDto } from './dtos/OrcamentoUpdateInput.dto';

@ApiTags('Orçamentos') 
@Controller('v1/orcamentos')
export class OrcamentosController {
  constructor(private readonly orcamentoService: OrcamentosService) {}

  @Post()
  @ApiOperation({ summary: 'Criar um novo orçamento' })
  @ApiBody({ type: OrcamentoCreateInputDto })
  @ApiResponse({ status: 201, description: 'Orçamento criado com sucesso.' })
  create(@Body() createOrcamentoDto: OrcamentoCreateInputDto) {
    return this.orcamentoService.create(createOrcamentoDto);
  }

  @Get()
  @ApiOperation({ summary: 'Buscar todos os orçamentos' })
  @ApiResponse({ status: 200, description: 'Lista de orçamentos.' })
  findAll() {
    return this.orcamentoService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar um orçamento pelo ID' })
  @ApiParam({ name: 'id', type: 'string', description: 'ID do orçamento', required: true })
  @ApiResponse({ status: 200, description: 'Orçamento encontrado.' })
  @ApiResponse({ status: 404, description: 'Orçamento não encontrado.' })
  async findOne(@Param('id') id: string) {
    return this.orcamentoService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar um orçamento' })
  @ApiParam({ name: 'id', type: 'string', description: 'ID do orçamento', required: true })
  @ApiBody({ type: OrcamentoUpdateInputDto })
  @ApiResponse({ status: 200, description: 'Orçamento atualizado com sucesso.' })
  @ApiResponse({ status: 404, description: 'Orçamento não encontrado.' })
  update(
    @Param('id') id: string,
    @Body() updateOrcamentoDto: OrcamentoUpdateInputDto,
  ) {
    return this.orcamentoService.update(+id, updateOrcamentoDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover um orçamento' })
  @ApiParam({ name: 'id', type: 'string', description: 'ID do orçamento', required: true })
  @ApiResponse({ status: 200, description: 'Orçamento removido com sucesso.' })
  @ApiResponse({ status: 404, description: 'Orçamento não encontrado.' })
  remove(@Param('id') id: string) {
    return this.orcamentoService.softDelete(+id);
  }
}

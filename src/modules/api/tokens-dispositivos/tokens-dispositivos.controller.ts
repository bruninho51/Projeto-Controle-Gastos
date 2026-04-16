import {
  Controller,
  Get,
  Put,
  Body,
  Param,
  Delete,
  NotFoundException,
  Req,
  UseGuards,
  ParseIntPipe,
} from "@nestjs/common";
import { TokensDispositivosService } from "./tokens-dispositivos.service";
import { TokenDispositivoUpsertDto } from "./dtos/TokenDispositivoUpsert.dto";
import { TokenDispositivoResponseDto } from "./dtos/TokenDispositivoResponse.dto";
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";

@ApiTags("Tokens de Dispositivos")
@ApiBearerAuth("access-token")
@ApiUnauthorizedResponse({ description: "Token inválido ou não informado" })
@ApiResponse({ status: 500, description: "Erro interno no servidor." })
@UseGuards(JwtAuthGuard)
@Controller("tokens-dispositivos")
export class TokensDispositivosController {
  constructor(
    private readonly tokensDispositivosService: TokensDispositivosService,
  ) {}

  @Put()
  @ApiOperation({
    summary: "Registrar ou substituir token de dispositivo",
    description:
      "Se o token já existir, atualiza o usuário e plataforma. Se não existir, cria um novo registro.",
  })
  @ApiBody({ type: TokenDispositivoUpsertDto })
  @ApiResponse({
    status: 200,
    description: "Token de dispositivo registrado/atualizado com sucesso.",
    type: TokenDispositivoResponseDto,
  })
  async upsert(
    @Req() { user },
    @Body() upsertDto: TokenDispositivoUpsertDto,
  ): Promise<TokenDispositivoResponseDto> {
    return this.tokensDispositivosService.upsert(user.id, upsertDto);
  }

  @Get()
  @ApiOperation({ summary: "Listar todos os tokens de dispositivos do usuário" })
  @ApiResponse({
    status: 200,
    description: "Lista de tokens de dispositivos.",
    type: TokenDispositivoResponseDto,
    isArray: true,
  })
  async findAll(
    @Req() { user },
  ): Promise<TokenDispositivoResponseDto[]> {
    return this.tokensDispositivosService.findAll(user.id);
  }

  @Get(":id")
  @ApiOperation({ summary: "Buscar um token de dispositivo pelo ID" })
  @ApiParam({ name: "id", type: Number, description: "ID do token", required: true })
  @ApiResponse({
    status: 200,
    description: "Token de dispositivo encontrado.",
    type: TokenDispositivoResponseDto,
  })
  @ApiResponse({ status: 404, description: "Token de dispositivo não encontrado." })
  async findOne(
    @Req() { user },
    @Param("id", ParseIntPipe) id: number,
  ): Promise<TokenDispositivoResponseDto> {
    const token = await this.tokensDispositivosService.findOne(user.id, id);

    if (!token) {
      throw new NotFoundException("O token de dispositivo informado não foi encontrado.");
    }

    return token;
  }

  @Delete(":id")
  @ApiOperation({ summary: "Remover um token de dispositivo" })
  @ApiParam({ name: "id", type: Number, description: "ID do token", required: true })
  @ApiResponse({
    status: 200,
    description: "Token de dispositivo removido com sucesso.",
    type: TokenDispositivoResponseDto,
  })
  @ApiResponse({ status: 404, description: "Token de dispositivo não encontrado." })
  async remove(
    @Req() { user },
    @Param("id", ParseIntPipe) id: number,
  ): Promise<TokenDispositivoResponseDto> {
    const token = await this.tokensDispositivosService.findOne(user.id, id);

    if (!token) {
      throw new NotFoundException("O token de dispositivo informado não foi encontrado.");
    }

    return this.tokensDispositivosService.remove(user.id, id);
  }
}
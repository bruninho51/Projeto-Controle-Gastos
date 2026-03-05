import {
  Body,
  Controller,
  Post,
  UnauthorizedException,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { firebaseApp } from "../../../../firebase.config";
import { ApiOperation, ApiResponse, ApiTags, ApiBody } from "@nestjs/swagger";
import { AuthResponseDto } from "./dto/AuthResponse.dto";
import { AuthCreateDto } from "./dto/AuthCreate.dto";

@ApiTags("Autenticação")
@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post("google/verify")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Autenticar usuário via Google e retornar JWT da API",
  })
  @ApiBody({ type: AuthCreateDto })
  @ApiResponse({
    status: 200,
    description: "Usuário autenticado com sucesso.",
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: "Token do Google inválido ou expirado.",
  })
  @ApiResponse({
    status: 500,
    description: "Erro interno no servidor.",
  })
  async googleVerify(@Body() body: AuthCreateDto): Promise<AuthResponseDto> {
    try {
      const { idToken } = body;
      const firebaseUser = await firebaseApp.auth().verifyIdToken(idToken);
      const user = await this.authService.findOrCreateUser(firebaseUser);
      const token = await this.authService.generateJwt(user);

      return AuthResponseDto.from({ access_token: token });
    } catch (error) {
      throw new UnauthorizedException("Token inválido ou expirado");
    }
  }
}

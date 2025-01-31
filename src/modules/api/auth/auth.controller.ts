import { Body, Controller, Post } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { admin } from "../../../../firebase.config";

@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post("google/verify")
  async googleVerify(@Body() body: { idToken: string }) {
    try {
      const { idToken } = body;

      const firebaseUser = await admin.auth().verifyIdToken(idToken);

      let user = await this.authService.findOrCreateUser(firebaseUser);

      const token = await this.authService.generateJwt(user);

      return { message: "Autenticado com sucesso!", access_token: token };
    } catch (error) {
      return { message: "Token inválido ou expirado", error };
    }
  }
}

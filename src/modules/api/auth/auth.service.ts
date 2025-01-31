import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Usuario } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async findOrCreateUser(firebaseUser: any) {
    let user = await this.prisma.usuario.findUnique({
      where: { email: firebaseUser.email },
    });

    if (!user) {
      user = await this.prisma.usuario.create({
        data: {
          email: firebaseUser.email,
          nome: firebaseUser.name,
          imagem: firebaseUser.picture,
          google_id: firebaseUser.uid,
        },
      });
    }

    return user;
  }

  async generateJwt(user: Usuario) {
    const payload = { email: user.email, sub: user.id };
    return this.jwtService.sign(payload);
  }
}

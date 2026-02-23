import { Inject, Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Usuario } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class AuthService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async findUser(email: string) {
    return await this.prisma.usuario.findUnique({
      where: { email },
    });
  }

  async findOrCreateUser(firebaseUser) {
    let user = await this.findUser(firebaseUser.email);

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
    const payload = { id: user.id, email: user.email, sub: user.id.toString() };
    return this.jwtService.sign(payload);
  }
}

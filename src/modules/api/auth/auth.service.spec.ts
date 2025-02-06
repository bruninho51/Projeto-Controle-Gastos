import { Test, TestingModule } from "@nestjs/testing";
import { AuthService } from "./auth.service";
import { PrismaService } from "../../prisma/prisma.service";
import { JwtService } from "@nestjs/jwt";
import { Usuario } from "@prisma/client";
import { faker } from "@faker-js/faker";

jest.mock("@nestjs/jwt");

const mockPrismaService = {
  usuario: {
    create: jest.fn(),
    findUnique: jest.fn(),
  },
};

describe("AuthService", () => {
  let authService: AuthService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        JwtService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
  });

  describe("findOrCreateUser", () => {
    it("should return an existing usuario if found", async () => {
      const firebaseUser = {
        email: faker.internet.email(),
        name: faker.person.fullName(),
        uid: faker.string.uuid(),
      };

      const existingUser: Usuario = {
        id: 1,
        email: faker.internet.email(),
        nome: faker.person.fullName(),
        imagem: faker.internet.url(),
        google_id: faker.string.uuid(),
        data_atualizacao: new Date(),
        data_criacao: new Date(),
        data_inatividade: null,
        soft_delete: null,
      };

      mockPrismaService.usuario.findUnique.mockResolvedValue(existingUser);

      const result = await authService.findOrCreateUser(firebaseUser);

      expect(mockPrismaService.usuario.findUnique).toHaveBeenCalledWith({
        where: { email: firebaseUser.email },
      });
      expect(result).toEqual(existingUser);
    });

    it("should create a new usuario if not found", async () => {
      const firebaseUser = {
        email: faker.internet.email(),
        name: faker.person.fullName(),
        uid: faker.string.uuid(),
      };

      const newUser: Usuario = {
        id: 2,
        email: faker.internet.email(),
        nome: faker.person.fullName(),
        imagem: faker.internet.url(),
        google_id: faker.string.uuid(),
        data_atualizacao: new Date(),
        data_criacao: new Date(),
        data_inatividade: null,
        soft_delete: null,
      };

      mockPrismaService.usuario.findUnique.mockResolvedValue(null);
      mockPrismaService.usuario.create.mockResolvedValue(newUser);

      const result = await authService.findOrCreateUser(firebaseUser);

      expect(mockPrismaService.usuario.findUnique).toHaveBeenCalledWith({
        where: { email: firebaseUser.email },
      });
      expect(mockPrismaService.usuario.create).toHaveBeenCalledWith({
        data: {
          email: firebaseUser.email,
          nome: firebaseUser.name,
          google_id: firebaseUser.uid,
        },
      });
      expect(result).toEqual(newUser);
    });
  });

  describe("generateJwt", () => {
    it("should generate a JWT token", async () => {
      const user: Usuario = {
        id: 1,
        email: faker.internet.email(),
        nome: faker.person.fullName(),
        google_id: faker.string.uuid(),
        imagem: faker.internet.url(),
        data_atualizacao: new Date(),
        data_criacao: new Date(),
        data_inatividade: null,
        soft_delete: null,
      };

      const payload = { id: user.id, email: user.email, sub: user.id };
      const token = faker.string.uuid();
      jwtService.sign = jest.fn().mockReturnValue(token);

      const result = await authService.generateJwt(user);

      expect(jwtService.sign).toHaveBeenCalledWith(payload);
      expect(result).toBe(token);
    });
  });
});

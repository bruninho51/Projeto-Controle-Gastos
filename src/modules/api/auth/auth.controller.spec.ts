import { Test, TestingModule } from "@nestjs/testing";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { admin } from "../../../../firebase.config";
import { faker } from "@faker-js/faker";

// Simulando o Firebase Admin SDK
jest.mock("../../../../firebase.config", () => ({
  admin: {
    auth: jest.fn().mockReturnValue({
      verifyIdToken: jest.fn(),
    }),
  },
}));

// Simulando o AuthService
jest.mock("./auth.service");

describe("AuthController", () => {
  let authController: AuthController;
  let authService: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [AuthService],
    }).compile();

    authController = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  describe("googleVerify", () => {
    it("should return a token if the idToken is valid", async () => {
      const firebaseUser = {
        email: faker.internet.email(),
        name: faker.person.fullName(),
        uid: faker.string.uuid(),
      };

      const idToken = faker.string.uuid();
      const accessToken = faker.string.uuid();
      const user = {
        id: 1,
        email: firebaseUser.email,
        nome: firebaseUser.name,
      };

      (admin.auth().verifyIdToken as jest.Mock).mockResolvedValue(firebaseUser);

      authService.findOrCreateUser = jest.fn().mockResolvedValue(user);
      authService.generateJwt = jest.fn().mockResolvedValue(accessToken);

      const result = await authController.googleVerify({ idToken });

      expect(admin.auth().verifyIdToken).toHaveBeenCalledWith(idToken);
      expect(authService.findOrCreateUser).toHaveBeenCalledWith(firebaseUser);
      expect(authService.generateJwt).toHaveBeenCalledWith(user);
      expect(result).toEqual({
        message: "Autenticado com sucesso!",
        access_token: accessToken,
      });
    });

    it("should return an error message if the token is invalid or expired", async () => {
      const idToken = faker.string.uuid();
      const errorMock = new Error(faker.lorem.sentence());

      (admin.auth().verifyIdToken as jest.Mock).mockRejectedValue(errorMock);

      const result = await authController.googleVerify({ idToken });

      expect(admin.auth().verifyIdToken).toHaveBeenCalledWith(idToken);
      expect(result).toEqual({
        message: "Token inválido ou expirado",
        error: errorMock,
      });
    });
  });
});

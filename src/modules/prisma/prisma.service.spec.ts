import { PrismaService, prismaServiceProvider } from "./prisma.service";

jest.mock("@prisma/adapter-mariadb", () => ({
  PrismaMariaDb: jest.fn().mockImplementation(() => ({})),
}));

const mockConnect = jest.fn().mockResolvedValue(undefined);
const mockDisconnect = jest.fn().mockResolvedValue(undefined);

jest.mock("@prisma/client", () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    $connect: mockConnect,
    $disconnect: mockDisconnect,
    $extends: jest.fn().mockImplementation(function () {
      return this;
    }),
  })),
}));

describe("PrismaService", () => {
  let prismaService: PrismaService;

  beforeEach(() => {
    jest.clearAllMocks();
    prismaService = prismaServiceProvider.useFactory();
  });

  it("should be defined", () => {
    expect(prismaService).toBeDefined();
  });

  describe("$connect", () => {
    it("should call $connect on PrismaClient", async () => {
      await prismaService.$connect();
      expect(mockConnect).toHaveBeenCalled();
    });
  });

  describe("$disconnect", () => {
    it("should call $disconnect on PrismaClient", async () => {
      await prismaService.$disconnect();
      expect(mockDisconnect).toHaveBeenCalled();
    });
  });
});
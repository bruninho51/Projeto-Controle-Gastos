import { Global, Module, OnApplicationShutdown } from "@nestjs/common";
import { ModuleRef } from "@nestjs/core";
import { PrismaService, prismaServiceProvider } from "./prisma.service";

@Global()
@Module({
  providers: [
    prismaServiceProvider,
    {
      provide: "PRISMA_LIFECYCLE",
      useFactory: async (prisma: PrismaService) => {
        await prisma.$connect();
        return prisma;
      },
      inject: [PrismaService],
    },
  ],
  exports: [PrismaService],
})
export class PrismaModule implements OnApplicationShutdown {
  constructor(private readonly moduleRef: ModuleRef) {}

  async onApplicationShutdown() {
    const prisma = this.moduleRef.get<PrismaService>(PrismaService);
    await prisma.$disconnect();
  }
}
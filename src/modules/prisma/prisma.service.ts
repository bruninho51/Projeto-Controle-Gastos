import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@prisma/client";

function createPrismaClient() {
  const adapter = new PrismaMariaDb({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT!),
    database: process.env.DB_NAME,
    connectionLimit: 50,
  });

  return new PrismaClient({ adapter }).$extends({
    query: {
      $allModels: {
        async $allOperations({ args, query }) {
          try {
            return await query(args);
          } catch (error: any) {
            if (error?.name === "DriverAdapterError") {
              throw new DriverAdapterError(
                error?.cause?.message ?? error.message,
                error?.cause,
                error?.clientVersion,
              );
            }
            throw error;
          }
        },
      },
    },
  });
}

export type PrismaService = ReturnType<typeof createPrismaClient>;
export const PrismaService = Symbol("PrismaService");

export const prismaServiceProvider = {
  provide: PrismaService,
  useFactory: () => {
    return createPrismaClient();
  },
};

export interface DriverAdapterCause {
  originalCode?: string;
  originalMessage?: string;
  kind?: string;
  code?: number;
  message?: string;
  state?: string;
  cause?: unknown;
}

export class DriverAdapterError extends Error {
  public readonly cause: DriverAdapterCause;
  public readonly clientVersion?: string;

  constructor(
    message: string,
    cause: DriverAdapterCause,
    clientVersion?: string,
  ) {
    super(message);
    this.name = "DriverAdapterError";
    this.cause = cause;
    this.clientVersion = clientVersion;
    Object.setPrototypeOf(this, DriverAdapterError.prototype);
  }
}

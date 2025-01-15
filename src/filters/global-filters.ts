import { PrismaClientKnownRequestErrorFilter } from "./prisma-client-known-request-error.filter";
import { PrismaClientUnknownRequestErrorFilter } from "./prisma-client-unknown-request-error.filter";

export const globalFilters = [
  new PrismaClientKnownRequestErrorFilter(),
  new PrismaClientUnknownRequestErrorFilter(),
];

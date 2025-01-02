import { PrismaClientKnownRequestErrorFilter } from "./prisma-exception.filter";

export const globalFilters = [
    new PrismaClientKnownRequestErrorFilter()
];
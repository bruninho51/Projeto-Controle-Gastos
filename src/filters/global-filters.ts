import { DriverAdapterErrorFilter } from "./driver-adapter-error.filter";
import { PrismaClientKnownRequestErrorFilter } from "./prisma-client-known-request-error.filter";
import { PrismaClientUnknownRequestErrorFilter } from "./prisma-client-unknown-request-error.filter";
import { AllExceptionsFilter } from "./all-exceptions.filter";

// Order matters, and it's the OPPOSITE of what you'd expect: Nest's
// RouterExceptionFilters.create() internally does `filters.reverse()`
// before matching (see node_modules/@nestjs/core/router/router-exception-filters.js),
// so the LAST filter registered here is actually checked FIRST at runtime,
// and the first match wins (an empty `@Catch()` matches everything).
// `AllExceptionsFilter` has an empty `@Catch()`, so it must stay FIRST in
// this array — after Nest reverses it, it ends up last, acting purely as a
// fallback for whatever the specific filters below don't claim. Putting it
// last here (the "intuitive" spot) silently swallows every exception,
// since it would end up first after the reversal.
export const globalFilters = [
  new AllExceptionsFilter(),
  new DriverAdapterErrorFilter(),
  new PrismaClientUnknownRequestErrorFilter(),
  new PrismaClientKnownRequestErrorFilter(),
];

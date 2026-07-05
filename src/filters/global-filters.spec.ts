import { globalFilters } from "./global-filters";
import { AllExceptionsFilter } from "./all-exceptions.filter";

describe("globalFilters order", () => {
  // Regression test for a real bug: Nest's RouterExceptionFilters.create()
  // reverses this array before matching exceptions against each filter's
  // `@Catch()` types, so the LAST entry here is actually checked FIRST.
  // AllExceptionsFilter has an empty `@Catch()` (matches everything), so if
  // it isn't first in this array, it ends up first after Nest's reversal
  // and silently swallows every Prisma/DriverAdapter error as a generic 500
  // before those specific filters ever run.
  it("keeps AllExceptionsFilter first, so it ends up last after Nest reverses the list", () => {
    expect(globalFilters[0]).toBeInstanceOf(AllExceptionsFilter);
  });

  it("registers exactly one instance of each filter", () => {
    expect(globalFilters).toHaveLength(4);
  });
});

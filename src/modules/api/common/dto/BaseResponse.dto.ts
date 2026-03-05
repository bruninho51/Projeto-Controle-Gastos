import { plainToInstance } from "class-transformer";

export abstract class BaseResponseDto {
  static from<T extends object>(
    this: new () => any,
    data: T,
  ): InstanceType<typeof this> {
    return plainToInstance(this, data, {
      excludeExtraneousValues: true,
    });
  }
}

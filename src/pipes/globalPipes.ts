import { ValidationPipe } from "@nestjs/common";

export const globalPipes = [
    new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
];
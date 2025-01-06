import { NestFactory } from '@nestjs/core';
import { AppModule } from './modules/app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { globalFilters } from './filters/global-filters';
import { globalPipes } from './pipes/globalPipes';
import { globalInterceptors } from './interceptors/globalInterceptors';

async function bootstrap() {
  const apiGlobalPrefix = '/api/v1';

  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix(apiGlobalPrefix);

  globalPipes.forEach(gp => app.useGlobalPipes(gp));
  globalFilters.forEach(gf => app.useGlobalFilters(gf));
  globalInterceptors.forEach(gi => app.useGlobalInterceptors(gi));

  const config = new DocumentBuilder()
    .setTitle('API de Orçamentos')
    .setDescription('A API para gerenciamento de orçamentos')
    .setVersion('1.0')
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(`${apiGlobalPrefix}/docs`, app, document);

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();

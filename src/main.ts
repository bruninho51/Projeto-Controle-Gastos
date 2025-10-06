//import { NestFactory } from "@nestjs/core";
//import { AppModule } from "./modules/app.module";
//import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
//import { globalFilters } from "./filters/global-filters";
//import { globalPipes } from "./pipes/globalPipes";
//import { globalInterceptors } from "./interceptors/globalInterceptors";
//import { Registry } from "prom-client";
import path from 'path';
import fs from 'fs';

// --------------------------
  // 🔹 Verificar .env
  const envPath = path.resolve('/app/.env'); // caminho onde Vault Agent deve injetar
  if (fs.existsSync(envPath)) {
    console.log('--- Arquivo .env encontrado ---');
    const content = fs.readFileSync(envPath, 'utf-8');
    console.log(content);
  } else {
    console.warn('.env não encontrado em /app/.env');
  }
  process.exit(1);
  // --------------------------

/*async function bootstrap() {
  const apiGlobalPrefix = "/api/v1";

  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: "*",
    methods: "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    allowedHeaders: "Content-Type, Authorization",
  });

  app.setGlobalPrefix(apiGlobalPrefix);

  globalPipes.forEach((gp) => app.useGlobalPipes(gp));
  globalFilters.forEach((gf) => app.useGlobalFilters(gf));
  globalInterceptors.forEach((gi) => app.useGlobalInterceptors(gi));

  const register = app.get(Registry);
  const promClient = await import('prom-client');
  promClient.collectDefaultMetrics({ register });

  app.use('/metrics', async (_req, res) => {
    try {
      const metrics = await register.metrics();
      res.setHeader('Content-Type', register.contentType);
      res.end(metrics);
    } catch (err) {
      res.status(500).end('Error collecting metrics');
    }
  });

  const config = new DocumentBuilder()
    .setTitle("API de Orçamentos")
    .setDescription("A API para gerenciamento de orçamentos")
    .setVersion("1.0")
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        in: 'header',
      },
      'access-token',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(`${apiGlobalPrefix}/docs`, app, document);

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();*/

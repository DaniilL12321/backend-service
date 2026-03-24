import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { DatabaseService } from './database/database.service';

export async function createApp() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  app.useGlobalFilters(new AllExceptionsFilter());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Books REST API')
    .setDescription(
      'REST API for books with JWT authorization, CRUD operations, validation, and unified error responses.',
    )
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, swaggerDocument);

  if (process.env.ENABLE_SCALAR !== 'false') {
    try {
      const { apiReference } = await import('@scalar/nestjs-api-reference');
      app.use(
        '/reference',
        apiReference({
          content: swaggerDocument,
          pageTitle: 'Books REST API Reference',
          title: 'Books REST API',
          theme: 'kepler',
          layout: 'modern',
          darkMode: false,
        }),
      );
    } catch (error) {
      logger.warn(
        'Scalar UI is unavailable in this runtime. Swagger remains available at /docs',
      );
      logger.debug(String(error));
    }
  }

  const databaseService = app.get(DatabaseService);
  await databaseService.initialize();

  return app;
}

async function bootstrap() {
  const app = await createApp();

  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}

if (require.main === module) {
  void bootstrap();
}

import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { DatabaseService } from './database/database.service';

async function bootstrap() {
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

  const databaseService = app.get(DatabaseService);
  await databaseService.initialize();

  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();

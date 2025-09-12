import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') || 3000;

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('CommiPay API')
    .setDescription('API documentation for CommiPay application')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true, // This will throw an error if non-whitelisted properties are found
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());

  await app.listen(port);
  console.log(`Application listening on port ${port}`);
}
bootstrap();

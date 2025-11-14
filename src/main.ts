import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: false,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger doc
  const config = new DocumentBuilder()
    .setTitle('Jitu Backend API')
    .setDescription('Jitu Academy Backend Docs')
    .setVersion('1.0')
    .addTag('jitu')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, documentFactory);

  app.enableCors({
    origin: [`http://localhost:5173`],
    credentials: true,
  });
  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();

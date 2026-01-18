import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import * as express from 'express';
import type { Request, Response, NextFunction } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: false,
  });
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.path.includes('/api/auth')) {
      next();
    } else {
      express.json()(req, res, next);
    }
  });

  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.path.includes('/api/auth')) {
      next();
    } else {
      express.urlencoded({ extended: true })(req, res, next);
    }
  });

  // Trust proxy is required for cookies to work correctly behind a load balancer (Railway)
  app.getHttpAdapter().getInstance().set('trust proxy', 1);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  app.enableCors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id'],
  });

  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();

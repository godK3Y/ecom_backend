import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const corsOrigins =
    process.env.NODE_ENV === 'production'
      ? [
          'https://tofu-frontend-one.vercel.app',
          'https://tofu-backend.onrender.com',
        ]
      : [
          'http://localhost:3001',
          'http://localhost:3000',
          'http://127.0.0.1:3001',
          'http://127.0.0.1:3000',
        ];

  console.log('🌐 CORS Origins configured:', corsOrigins);

  app.enableCors({
    origin: corsOrigins,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    credentials: true, // This is crucial for cookies
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'Cache-Control',
      'Set-Cookie',
      'Cookie',
    ],
    exposedHeaders: ['Set-Cookie', 'Authorization'],
    preflightContinue: false,
    optionsSuccessStatus: 204,
    maxAge: 86400, // Cache preflight for 24 hours
  });

  app.use(cookieParser());
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();

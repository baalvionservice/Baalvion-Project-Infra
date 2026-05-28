import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import helmet from 'helmet';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: false });

  const prefix = process.env.API_PREFIX || 'api/v1';
  app.setGlobalPrefix(prefix);
  app.use(helmet());
  app.enableCors({
    origin: (process.env.CORS_ORIGINS || '').split(',').filter(Boolean),
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: false }),
  );

  const swaggerCfg = new DocumentBuilder()
    .setTitle('Baalvion OS API')
    .setDescription('Unified backend — replaces Firebase')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, swaggerCfg));

  const port = Number(process.env.PORT) || 4100;
  await app.listen(port, '0.0.0.0');
  Logger.log(`Baalvion OS listening on http://localhost:${port}/${prefix}`, 'Bootstrap');
}
bootstrap();

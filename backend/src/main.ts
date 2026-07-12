import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidationPipe } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { PrismaExceptionFilter } from "./common/filters/prisma-exception.filter";
import helmet from "helmet";
import cookieParser from "cookie-parser";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. Global Security Middleware
  app.use(helmet());
  app.use(cookieParser());
  app.enableCors({
    origin: process.env.CORS_ORIGIN || "*",
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
    credentials: true,
  });

  // 2. Global Pipes & Filters
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalFilters(new PrismaExceptionFilter());

  // 3. Swagger OpenAPI Documentation
  const config = new DocumentBuilder()
    .setTitle("Element 5 Creator Platform — Core API Monolith")
    .setDescription(
      "RESTful endpoint index supporting the Element 5 Creator Ecosystem, StageVerse live voting, event ticketing, and social groups.",
    )
    .setVersion("1.0.0")
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/docs", app, document);

  // 4. Server Start
  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`🚀 Element 5 Core Backend is running on: http://localhost:${port}`);
  console.log(`📖 API Documentation is available at: http://localhost:${port}/api/docs`);
}
bootstrap();

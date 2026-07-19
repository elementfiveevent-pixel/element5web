import { NestFactory, Reflector } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidationPipe, Logger } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { PrismaExceptionFilter } from "./common/filters/prisma-exception.filter";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { json, urlencoded } from "express";

import { gzipMiddleware } from "./common/middleware/gzip.middleware";

async function bootstrap() {
  if (process.env.NODE_ENV === "production" && !process.env.JWT_SECRET) {
    throw new Error("FATAL: JWT_SECRET environment variable is required in production mode.");
  }
  if (process.env.NODE_ENV === "production" && !process.env.ADMIN_TOTP_SECRET) {
    throw new Error("FATAL: ADMIN_TOTP_SECRET environment variable is required in production mode.");
  }

  const app = await NestFactory.create(AppModule);

  // 1. Global Security Middleware & Compression
  app.use(gzipMiddleware);
  app.use(json({ limit: "50mb" }));
  app.use(urlencoded({ limit: "50mb", extended: true }));
  app.use(helmet());
  app.use(cookieParser());

  const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(",").map(o => o.trim())
    : ["http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000"];

  app.enableCors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin) || allowedOrigins.includes("*")) {
        callback(null, true);
      } else {
        callback(new Error("CORS policy block: origin not whitelisted"));
      }
    },
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
  await app.listen(port, "0.0.0.0");
  Logger.log(`🚀 Element 5 Core Backend running on: http://localhost:${port}`, "Bootstrap");
  Logger.log(`📖 API docs: http://localhost:${port}/api/docs`, "Bootstrap");
}
bootstrap();

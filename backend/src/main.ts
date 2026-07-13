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

  const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(",").map(o => o.trim())
    : ["http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000"];

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin) || allowedOrigins.includes("*") || allowedOrigins.includes("https://*") || origin.endsWith(".vercel.app")) {
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
  await app.listen(port);
  console.log(`🚀 Element 5 Core Backend is running on: http://localhost:${port}`);
  console.log(`📖 API Documentation is available at: http://localhost:${port}/api/docs`);
}
bootstrap();

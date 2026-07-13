"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const prisma_exception_filter_1 = require("./common/filters/prisma-exception.filter");
const helmet_1 = __importDefault(require("helmet"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.use((0, helmet_1.default)());
    app.use((0, cookie_parser_1.default)());
    const allowedOrigins = process.env.CORS_ORIGIN
        ? process.env.CORS_ORIGIN.split(",").map(o => o.trim())
        : ["http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000"];
    app.enableCors({
        origin: (origin, callback) => {
            if (!origin)
                return callback(null, true);
            if (allowedOrigins.includes(origin) || allowedOrigins.includes("*") || allowedOrigins.includes("https://*") || origin.endsWith(".vercel.app")) {
                callback(null, true);
            }
            else {
                callback(new Error("CORS policy block: origin not whitelisted"));
            }
        },
        methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
        credentials: true,
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
    }));
    app.useGlobalFilters(new prisma_exception_filter_1.PrismaExceptionFilter());
    const config = new swagger_1.DocumentBuilder()
        .setTitle("Element 5 Creator Platform — Core API Monolith")
        .setDescription("RESTful endpoint index supporting the Element 5 Creator Ecosystem, StageVerse live voting, event ticketing, and social groups.")
        .setVersion("1.0.0")
        .addBearerAuth()
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup("api/docs", app, document);
    const port = process.env.PORT || 4000;
    await app.listen(port);
    console.log(`🚀 Element 5 Core Backend is running on: http://localhost:${port}`);
    console.log(`📖 API Documentation is available at: http://localhost:${port}/api/docs`);
}
bootstrap();
//# sourceMappingURL=main.js.map
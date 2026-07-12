"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
let PrismaExceptionFilter = class PrismaExceptionFilter {
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        if (exception instanceof common_1.HttpException) {
            const status = exception.getStatus();
            const responseData = exception.getResponse();
            const message = typeof responseData === "object" && responseData.message
                ? responseData.message
                : exception.message;
            return response.status(status).json({
                statusCode: status,
                errorCode: "HTTP_ERROR",
                message,
                timestamp: new Date().toISOString(),
            });
        }
        let status = common_1.HttpStatus.INTERNAL_SERVER_ERROR;
        let message = "Internal database error";
        let errorCode = "DB_ERROR";
        const code = exception?.code;
        if (code) {
            switch (code) {
                case "23505":
                    status = common_1.HttpStatus.CONFLICT;
                    message = `Unique constraint violation: ${exception.detail || exception.message}`;
                    errorCode = "UNIQUE_CONSTRAINT_VIOLATION";
                    break;
                case "23503":
                    status = common_1.HttpStatus.BAD_REQUEST;
                    message = `Foreign key violation: ${exception.detail || exception.message}`;
                    errorCode = "FOREIGN_KEY_VIOLATION";
                    break;
                case "22001":
                    status = common_1.HttpStatus.BAD_REQUEST;
                    message = "Database input value length limits exceeded";
                    errorCode = "VALUE_TOO_LONG";
                    break;
                default:
                    message = exception.message || message;
                    break;
            }
        }
        else {
            message = exception?.message || message;
        }
        response.status(status).json({
            statusCode: status,
            errorCode,
            message,
            timestamp: new Date().toISOString(),
        });
    }
};
exports.PrismaExceptionFilter = PrismaExceptionFilter;
exports.PrismaExceptionFilter = PrismaExceptionFilter = __decorate([
    (0, common_1.Catch)()
], PrismaExceptionFilter);
//# sourceMappingURL=prisma-exception.filter.js.map
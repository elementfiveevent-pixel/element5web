import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from "@nestjs/common";
import { Response } from "express";

@Catch()
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const responseData = exception.getResponse();
      const message = typeof responseData === "object" && (responseData as any).message
        ? (responseData as any).message
        : exception.message;

      return response.status(status).json({
        statusCode: status,
        errorCode: "HTTP_ERROR",
        message,
        timestamp: new Date().toISOString(),
      });
    }

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = "Internal database error";
    let errorCode = "DB_ERROR";

    // Handle generic postgres error codes (from raw pg driver)
    const code = exception?.code;
    if (code) {
      switch (code) {
        case "23505": // Unique violation
          status = HttpStatus.CONFLICT;
          message = `Unique constraint violation: ${exception.detail || exception.message}`;
          errorCode = "UNIQUE_CONSTRAINT_VIOLATION";
          break;
        case "23503": // Foreign key violation
          status = HttpStatus.BAD_REQUEST;
          message = `Foreign key violation: ${exception.detail || exception.message}`;
          errorCode = "FOREIGN_KEY_VIOLATION";
          break;
        case "22001": // Value too long
          status = HttpStatus.BAD_REQUEST;
          message = "Database input value length limits exceeded";
          errorCode = "VALUE_TOO_LONG";
          break;
        default:
          message = exception.message || message;
          break;
      }
    } else {
      message = exception?.message || message;
    }

    response.status(status).json({
      statusCode: status,
      errorCode,
      message,
      timestamp: new Date().toISOString(),
    });
  }
}

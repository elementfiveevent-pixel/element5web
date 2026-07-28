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
        case "28P01": // Password authentication failed
          status = HttpStatus.SERVICE_UNAVAILABLE;
          message = "Database authentication failed. Please verify DATABASE_URL credentials in server environment settings.";
          errorCode = "DATABASE_AUTHENTICATION_FAILED";
          break;
        case "ECONNREFUSED":
        case "57P01":
          status = HttpStatus.SERVICE_UNAVAILABLE;
          message = "Database service is currently offline or unreachable.";
          errorCode = "DATABASE_UNAVAILABLE";
          break;
        default:
          message = exception.message || message;
          break;
      }
    } else {
      const excMsg = String(exception?.message || exception);
      if (excMsg.includes("password authentication failed")) {
        status = HttpStatus.SERVICE_UNAVAILABLE;
        message = "Database authentication failed. Please verify DATABASE_URL credentials in server environment settings.";
        errorCode = "DATABASE_AUTHENTICATION_FAILED";
      } else {
        message = excMsg || message;
      }
    }

    response.status(status).json({
      statusCode: status,
      errorCode,
      message,
      timestamp: new Date().toISOString(),
    });
  }
}

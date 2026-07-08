import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { Response } from "express";

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = "Internal database error";
    let errorCode = "DB_ERROR";

    // Handle known Prisma codes (e.g. P2002 Unique constraint, P2025 Record not found)
    switch (exception.code) {
      case "P2002":
        status = HttpStatus.CONFLICT;
        message = `Unique constraint failed on field: ${(exception.meta?.target as string[])?.join(", ")}`;
        errorCode = "UNIQUE_CONSTRAINT_VIOLATION";
        break;
      case "P2025":
        status = HttpStatus.NOT_FOUND;
        message = exception.meta?.cause as string || "Record not found";
        errorCode = "RECORD_NOT_FOUND";
        break;
      case "P2003":
        status = HttpStatus.BAD_REQUEST;
        message = "Foreign key constraint failed on relation";
        errorCode = "FOREIGN_KEY_VIOLATION";
        break;
      default:
        message = exception.message;
        break;
    }

    response.status(status).json({
      statusCode: status,
      errorCode,
      message,
      timestamp: new Date().toISOString(),
    });
  }
}

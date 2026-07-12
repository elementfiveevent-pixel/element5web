import { ArgumentsHost, ExceptionFilter } from "@nestjs/common";
import { Response } from "express";
export declare class PrismaExceptionFilter implements ExceptionFilter {
    catch(exception: any, host: ArgumentsHost): Response<any, Record<string, any>> | undefined;
}

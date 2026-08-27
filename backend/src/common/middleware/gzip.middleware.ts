import { Request, Response, NextFunction } from "express";
import * as zlib from "zlib";

export function gzipMiddleware(req: Request, res: Response, next: NextFunction) {
  const acceptEncoding = req.headers["accept-encoding"] || "";
  
  // Only compress if client accepts gzip and it's a GET or POST response
  if (!acceptEncoding.includes("gzip") || req.method === "HEAD" || req.method === "OPTIONS") {
    return next();
  }

  const chunks: Buffer[] = [];
  const oldWrite = res.write;
  const oldEnd = res.end;

  res.write = function (chunk: any, encodingOrCb?: any, cb?: any): boolean {
    if (chunk) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, typeof encodingOrCb === "string" ? (encodingOrCb as any) : "utf8"));
    }
    return true;
  } as any;

  res.end = function (chunk: any, encodingOrCb?: any, cb?: any): any {
    if (chunk) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, typeof encodingOrCb === "string" ? (encodingOrCb as any) : "utf8"));
    }

    const buffer = Buffer.concat(chunks);
    const contentType = res.getHeader("content-type") || "";
    
    // Only compress text-based and json payloads over 1KB
    const shouldCompress = 
      /json|text|html|javascript|css|xml/i.test(String(contentType)) && 
      buffer.length > 1024;

    if (shouldCompress) {
      zlib.gzip(buffer, (err, compressed) => {
        if (err) {
          res.setHeader("Content-Length", buffer.length);
          if (buffer.length > 0) {
            (oldWrite as any).call(res, buffer);
          }
          oldEnd.call(res, undefined, encodingOrCb, cb);
        } else {
          res.setHeader("Content-Encoding", "gzip");
          res.setHeader("Content-Length", compressed.length);
          (oldWrite as any).call(res, compressed);
          oldEnd.call(res, undefined, encodingOrCb, cb);
        }
      });
    } else {
      res.setHeader("Content-Length", buffer.length);
      if (buffer.length > 0) {
        (oldWrite as any).call(res, buffer);
      }
      oldEnd.call(res, undefined, encodingOrCb, cb);
    }
  } as any;

  next();
}

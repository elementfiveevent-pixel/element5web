import { Controller, Get, Res, HttpStatus } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { RedisService } from "../../common/redis/redis.service";
import { Response } from "express";
import { ApiTags, ApiOperation } from "@nestjs/swagger";

@ApiTags("System Health & Metrics")
@Controller()
export class StatsController {
  constructor(
    private prisma: PrismaService,
    private redisService: RedisService,
  ) {}

  @Get("health")
  @ApiOperation({ summary: "Liveness and Readiness probe check" })
  async checkHealth(@Res() res: any) {
    let dbStatus = "DOWN";
    let redisStatus = "DOWN";
    let statusCode = HttpStatus.OK;

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      dbStatus = "UP";
    } catch (e) {
      statusCode = HttpStatus.SERVICE_UNAVAILABLE;
    }

    try {
      const client = this.redisService.getClient();
      if (client) {
        const ping = await client.ping();
        if (ping === "PONG") {
          redisStatus = "UP";
        }
      }
    } catch (e) {
      statusCode = HttpStatus.SERVICE_UNAVAILABLE;
    }

    return res.status(statusCode).json({
      status: statusCode === HttpStatus.OK ? "HEALTHY" : "UNHEALTHY",
      database: dbStatus,
      redis: redisStatus,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  }

  @Get("metrics")
  @ApiOperation({ summary: "Expose Prometheus application metrics" })
  async getMetrics(@Res() res: any) {
    // Return standard Prometheus response headers
    res.setHeader("Content-Type", "text/plain; version=0.0.4; charset=utf-8");
    
    // Stub dynamic metrics (database connections, queue backlogs)
    const dbSizeQuery: any[] = await this.prisma.$queryRaw`
      SELECT pg_database_size(current_database()) AS size
    `;
    const dbSize = dbSizeQuery[0]?.size || 0;
    
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();

    const prometheusFormat = [
      `# HELP element5_app_uptime Uptime of the application in seconds`,
      `# TYPE element5_app_uptime gauge`,
      `element5_app_uptime ${uptime}`,
      ``,
      `# HELP element5_db_size_bytes Postgres database disk usage size`,
      `# TYPE element5_db_size_bytes gauge`,
      `element5_db_size_bytes ${dbSize}`,
      ``,
      `# HELP element5_memory_heap_used_bytes Node process heap memory usage`,
      `# TYPE element5_memory_heap_used_bytes gauge`,
      `element5_memory_heap_used_bytes ${memoryUsage.heapUsed}`,
    ].join("\n");

    return res.status(HttpStatus.OK).send(prometheusFormat);
  }
}

"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatsController = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const redis_service_1 = require("../../common/redis/redis.service");
const swagger_1 = require("@nestjs/swagger");
let StatsController = class StatsController {
    prisma;
    redisService;
    constructor(prisma, redisService) {
        this.prisma = prisma;
        this.redisService = redisService;
    }
    async checkHealth(res) {
        let dbStatus = "DOWN";
        let redisStatus = "DOWN";
        let statusCode = common_1.HttpStatus.OK;
        try {
            await this.prisma.$queryRaw `SELECT 1`;
            dbStatus = "UP";
        }
        catch (e) {
            statusCode = common_1.HttpStatus.SERVICE_UNAVAILABLE;
        }
        try {
            const client = this.redisService.getClient();
            if (client) {
                const ping = await client.ping();
                if (ping === "PONG") {
                    redisStatus = "UP";
                }
            }
        }
        catch (e) {
            statusCode = common_1.HttpStatus.SERVICE_UNAVAILABLE;
        }
        return res.status(statusCode).json({
            status: statusCode === common_1.HttpStatus.OK ? "HEALTHY" : "UNHEALTHY",
            database: dbStatus,
            redis: redisStatus,
            uptime: process.uptime(),
            timestamp: new Date().toISOString(),
        });
    }
    async getMetrics(res) {
        res.setHeader("Content-Type", "text/plain; version=0.0.4; charset=utf-8");
        const dbSizeQuery = await this.prisma.$queryRaw `
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
        return res.status(common_1.HttpStatus.OK).send(prometheusFormat);
    }
};
exports.StatsController = StatsController;
__decorate([
    (0, common_1.Get)("health"),
    (0, swagger_1.ApiOperation)({ summary: "Liveness and Readiness probe check" }),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], StatsController.prototype, "checkHealth", null);
__decorate([
    (0, common_1.Get)("metrics"),
    (0, swagger_1.ApiOperation)({ summary: "Expose Prometheus application metrics" }),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], StatsController.prototype, "getMetrics", null);
exports.StatsController = StatsController = __decorate([
    (0, swagger_1.ApiTags)("System Health & Metrics"),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_service_1.RedisService])
], StatsController);
//# sourceMappingURL=stats.controller.js.map
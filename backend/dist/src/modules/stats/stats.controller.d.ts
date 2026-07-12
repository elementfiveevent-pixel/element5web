import { PrismaService } from "../../prisma/prisma.service";
import { RedisService } from "../../common/redis/redis.service";
export declare class StatsController {
    private prisma;
    private redisService;
    constructor(prisma: PrismaService, redisService: RedisService);
    checkHealth(res: any): Promise<any>;
    getMetrics(res: any): Promise<any>;
}

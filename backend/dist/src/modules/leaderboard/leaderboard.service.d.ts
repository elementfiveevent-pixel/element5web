import { PrismaService } from "../../prisma/prisma.service";
import { RedisService } from "../../common/redis/redis.service";
export declare class LeaderboardService {
    private prisma;
    private redisService;
    constructor(prisma: PrismaService, redisService: RedisService);
    getGlobalLeaderboard(timeframe?: string, limit?: number): Promise<any>;
    invalidateCache(timeframe: string): Promise<void>;
}

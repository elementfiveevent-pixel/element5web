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
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeaderboardService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const redis_service_1 = require("../../common/redis/redis.service");
let LeaderboardService = class LeaderboardService {
    prisma;
    redisService;
    constructor(prisma, redisService) {
        this.prisma = prisma;
        this.redisService = redisService;
    }
    async getGlobalLeaderboard(timeframe = "ALL_TIME", limit = 50) {
        const cacheKey = `leaderboard:${timeframe}:limit:${limit}`;
        const cached = await this.redisService.get(cacheKey);
        if (cached) {
            return JSON.parse(cached);
        }
        let standings;
        if (timeframe === "ALL_TIME") {
            standings = await this.prisma.artistProfile.findMany({
                where: { isVerified: true },
                include: {
                    user: {
                        select: {
                            fullName: true,
                            profilePhotoUrl: true,
                            reputationXp: true,
                        },
                    },
                },
                orderBy: {
                    user: {
                        reputationXp: "desc",
                    },
                },
                take: limit,
            });
            standings = standings.map((item, idx) => ({
                rank: idx + 1,
                artistId: item.id,
                performer: item.stageName,
                photoUrl: item.user.profilePhotoUrl,
                score: item.user.reputationXp,
            }));
        }
        else {
            const dbStandings = await this.prisma.leaderboardStanding.findMany({
                where: { timeframe },
                orderBy: { totalScore: "desc" },
                take: limit,
            });
            const artistIds = dbStandings.map((s) => s.artistProfileId);
            const profiles = await this.prisma.artistProfile.findMany({
                where: { id: { in: artistIds } },
                include: { user: true },
            });
            const profileMap = new Map(profiles.map((p) => [p.id, p]));
            standings = dbStandings.map((s, idx) => {
                const profile = profileMap.get(s.artistProfileId);
                return {
                    rank: idx + 1,
                    artistId: s.artistProfileId,
                    performer: profile?.stageName || "Unknown Artist",
                    photoUrl: profile?.user.profilePhotoUrl || null,
                    score: s.totalScore,
                };
            });
        }
        await this.redisService.set(cacheKey, JSON.stringify(standings), 600);
        return standings;
    }
    async invalidateCache(timeframe) {
        const client = this.redisService.getClient();
        if (!client)
            return;
        const keys = await client.keys(`leaderboard:${timeframe}:*`);
        if (keys.length > 0) {
            await client.del(...keys);
        }
    }
};
exports.LeaderboardService = LeaderboardService;
exports.LeaderboardService = LeaderboardService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_service_1.RedisService])
], LeaderboardService);
//# sourceMappingURL=leaderboard.service.js.map
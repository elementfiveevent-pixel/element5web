import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { RedisService } from "../../common/redis/redis.service";

@Injectable()
export class LeaderboardService {
  constructor(
    private prisma: PrismaService,
    private redisService: RedisService,
  ) {}

  async getGlobalLeaderboard(timeframe = "ALL_TIME", limit = 50) {
    const cacheKey = `leaderboard:${timeframe}:limit:${limit}`;
    const cached = await this.redisService.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    let standings;

    if (timeframe === "ALL_TIME") {
      // Return top artists ordered by their reputation XP
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

      // Map to consistent standings format
      standings = standings.map((item, idx) => ({
        rank: idx + 1,
        artistId: item.id,
        performer: item.stageName,
        photoUrl: item.user.profilePhotoUrl,
        score: item.user.reputationXp,
      }));
    } else {
      // Query specific timeframe standings from LeaderboardStanding table
      const dbStandings = await this.prisma.leaderboardStanding.findMany({
        where: { timeframe },
        orderBy: { totalScore: "desc" },
        take: limit,
      });

      // Fetch artist profiles
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

    // Save cache with 10 minutes TTL
    await this.redisService.set(cacheKey, JSON.stringify(standings), 600);

    return standings;
  }

  async invalidateCache(timeframe: string) {
    const client = this.redisService.getClient();
    if (!client) return; // Redis not available, skip cache invalidation
    
    const keys = await client.keys(`leaderboard:${timeframe}:*`);
    if (keys.length > 0) {
      await client.del(...keys);
    }
  }
}

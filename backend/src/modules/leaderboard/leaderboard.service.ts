import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class LeaderboardService {
  constructor(private prisma: PrismaService) {}

  // 1. Fetch events that have conducted voting or submissions
  async getVotingEvents() {
    try {
      const submissions = await this.prisma.stageVerseSubmission.findMany({
        select: { eventId: true },
      }).catch(() => []);
      
      const eventIds = Array.from(new Set(submissions.map((s: any) => s.eventId))).filter((id): id is string => typeof id === "string" && id.trim().length > 0);

      if (eventIds.length === 0) {
        const events = await this.prisma.event.findMany({
          take: 20,
          orderBy: { startDate: "desc" }
        }).catch(() => []);
        return events.map((e: any) => ({
          id: e.id,
          title: e.title,
          category: e.category,
          startDate: e.startDate,
        }));
      }

      const events = await this.prisma.event.findMany({
        where: { id: { in: eventIds } },
        orderBy: { startDate: "desc" }
      }).catch(() => []);

      return events.map((e: any) => ({
        id: e.id,
        title: e.title,
        category: e.category,
        startDate: e.startDate,
      }));
    } catch {
      return [];
    }
  }

  // 2. Fetch Leaderboard filtered strictly by voting scores (ALL_TIME, MONTHLY, EVENT)
  async getGlobalLeaderboard(timeframe = "ALL_TIME", eventId?: string, limit = 50) {
    try {
      let submissionWhere: any = {};

      if (timeframe === "EVENT") {
        if (eventId && typeof eventId === "string" && eventId.trim().length > 0) {
          submissionWhere.eventId = eventId;
        }
      } else if (timeframe === "MONTHLY") {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        submissionWhere.createdAt = { gte: startOfMonth };
      }

      // 1. Fetch base submissions
      const submissions = await this.prisma.stageVerseSubmission.findMany({
        where: submissionWhere,
      }).catch(() => []);

      if (submissions.length === 0) return [];

      const submissionIds = submissions.map((s: any) => s.id);
      const userIds = Array.from(new Set(submissions.map((s: any) => s.userId).filter(Boolean)));
      const eventIds = Array.from(new Set(submissions.map((s: any) => s.eventId).filter(Boolean)));

      // 2. Fetch Votes for these submissions
      const votes = await this.prisma.vote.findMany({
        where: { submissionId: { in: submissionIds } }
      }).catch(() => []);

      if (votes.length === 0) return [];

      // 3. Fetch Users, Events & ArtistProfiles
      const users = userIds.length > 0
        ? await this.prisma.user.findMany({ where: { id: { in: userIds } } }).catch(() => [])
        : [];
      const userMap = new Map(users.map((u: any) => [u.id, u]));

      const events = eventIds.length > 0
        ? await this.prisma.event.findMany({ where: { id: { in: eventIds } } }).catch(() => [])
        : [];
      const eventMap = new Map(events.map((e: any) => [e.id, e]));

      const profiles = userIds.length > 0
        ? await this.prisma.artistProfile.findMany({ where: { userId: { in: userIds } } }).catch(() => [])
        : [];
      const profileMap = new Map(profiles.map((p: any) => [p.userId, p]));

      // Group votes by submissionId
      const votesBySubmission = new Map<string, any[]>();
      for (const v of votes) {
        const existing = votesBySubmission.get(v.submissionId) || [];
        existing.push(v);
        votesBySubmission.set(v.submissionId, existing);
      }

      // 4. Aggregate by User / Performer
      const aggregatedMap = new Map<string, {
        submissionId: string;
        userId: string;
        stageName: string;
        photoUrl: string;
        genre: string;
        location: string;
        eventTitle: string;
        trackTitle: string;
        votesCount: number;
        totalVoteScoreSum: number;
      }>();

      for (const sub of submissions) {
        const subVotes = votesBySubmission.get(sub.id) || [];
        if (subVotes.length === 0) continue; // Show ONLY performers with votes

        const user: any = userMap.get(sub.userId);
        const profile: any = profileMap.get(sub.userId);
        const event: any = eventMap.get(sub.eventId);

        const key = sub.userId || sub.id;
        const currentVotesCount = subVotes.length;
        const currentSum = subVotes.reduce((acc: number, v: any) => acc + (Number(v.score) || 5.0), 0);

        const existing = aggregatedMap.get(key);
        if (existing) {
          existing.votesCount += currentVotesCount;
          existing.totalVoteScoreSum += currentSum;
        } else {
          const stageName = profile?.stageName || user?.fullName || "Verified Performer";
          const genre = profile?.genres?.[0] || profile?.genre || "Creator";
          const location = [profile?.city, profile?.state].filter(Boolean).join(", ") || "Gujarat";

          aggregatedMap.set(key, {
            submissionId: sub.id,
            userId: sub.userId,
            stageName,
            photoUrl: user?.profilePhotoUrl || "",
            genre,
            location,
            eventTitle: event?.title || "Open Mic",
            trackTitle: sub.trackTitle || "Live Performance",
            votesCount: currentVotesCount,
            totalVoteScoreSum: currentSum,
          });
        }
      }

      const standingsList = Array.from(aggregatedMap.values()).map((item) => {
        const audienceAverage = item.votesCount > 0 ? item.totalVoteScoreSum / item.votesCount : 0;
        const totalScore = Number((audienceAverage * 10).toFixed(2));

        return {
          id: item.submissionId,
          userId: item.userId,
          artistProfileId: item.userId,
          name: item.stageName,
          performer: item.stageName,
          photoUrl: item.photoUrl,
          avatar: item.photoUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(item.stageName)}&backgroundColor=121212&textColor=FAF8F5`,
          genre: item.genre,
          location: item.location,
          eventTitle: item.eventTitle,
          trackTitle: item.trackTitle,
          votes: item.votesCount,
          votesCount: item.votesCount,
          audienceAverage: Number(audienceAverage.toFixed(2)),
          rating: Number(audienceAverage.toFixed(2)),
          score: totalScore,
          totalScore: totalScore,
        };
      });

      standingsList.sort((a, b) => b.totalScore - a.totalScore);

      return standingsList.slice(0, limit).map((item, idx) => ({
        ...item,
        rank: idx + 1,
      }));
    } catch {
      return [];
    }
  }

  async invalidateCache() {}
}

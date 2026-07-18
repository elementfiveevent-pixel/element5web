import { Injectable, NotFoundException, ConflictException, ForbiddenException, Inject, forwardRef } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { SubmitTrackDto } from "./dto/submit-track.dto";
import { SubmitScoreDto } from "./dto/submit-score.dto";
import { StageVerseGateway } from "./stageverse.gateway";

@Injectable()
export class StageVerseService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => StageVerseGateway))
    private gateway: StageVerseGateway,
  ) {}

  private votingStates = new Map<string, boolean>();

  private async assertOrganizerAccess(eventId: string, organizerId: string, roles: string[] = []) {
    if (roles.includes("SUPER_ADMIN")) return;

    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException("Event not found");
    }

    if (event.organizerId !== organizerId) {
      throw new ForbiddenException("You do not have access to this event");
    }
  }

  async toggleVoting(userId: string, roles: string[], eventId: string, open: boolean, durationSeconds?: number) {
    await this.assertOrganizerAccess(eventId, userId, roles);
    const expiresAt = open && durationSeconds ? new Date(Date.now() + durationSeconds * 1000) : null;

    await this.prisma.event.update({
      where: { id: eventId },
      data: { 
        votingActive: open,
        votingExpiresAt: expiresAt
      }
    });

    this.votingStates.set(eventId, open);
    this.gateway.server.to(eventId).emit("votingStatusUpdate", { 
      open, 
      expiresAt: expiresAt ? expiresAt.getTime() : null 
    });
    return { success: true, open, expiresAt: expiresAt ? expiresAt.getTime() : null };
  }

  async getVotingStatus(eventId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: { votingActive: true, votingExpiresAt: true, currentPerformerId: true }
    });
    
    let open = event ? (event.votingActive ?? false) : (this.votingStates.get(eventId) ?? false);
    let expiresAt = event?.votingExpiresAt ? new Date(event.votingExpiresAt).getTime() : null;

    if (open && expiresAt && expiresAt < Date.now()) {
      open = false;
      expiresAt = null;
      await this.prisma.event.update({
        where: { id: eventId },
        data: { votingActive: false, votingExpiresAt: null }
      });
      this.votingStates.set(eventId, false);
      this.gateway.server.to(eventId).emit("votingStatusUpdate", { open: false, expiresAt: null });
    }

    return { open, expiresAt, currentPerformerId: event?.currentPerformerId ?? null };
  }

  async toggleLeaderboard(userId: string, roles: string[], eventId: string, show: boolean) {
    await this.assertOrganizerAccess(eventId, userId, roles);
    await this.prisma.event.update({
      where: { id: eventId },
      data: { showLeaderboard: show }
    });
    this.gateway.server.to(eventId).emit("leaderboardVisibilityUpdate", { show });
    return { success: true, show };
  }

  async resetVotes(userId: string, roles: string[], eventId: string) {
    await this.assertOrganizerAccess(eventId, userId, roles);
    const submissions = await this.prisma.stageVerseSubmission.findMany({
      where: { eventId },
      select: { id: true },
    });
    const subIds = submissions.map((s: any) => s.id);
    await this.prisma.vote.deleteMany({
      where: { submissionId: { in: subIds } },
    });

    const standings = await this.calculateStandings(eventId);
    this.gateway.broadcastLeaderboard(eventId, standings);

    return { success: true, message: "All votes reset successfully" };
  }

  async submitTrack(userId: string, dto: SubmitTrackDto) {
    const event = await this.prisma.event.findUnique({
      where: { id: dto.eventId },
    });
    if (!event) {
      throw new NotFoundException("Event not found");
    }

    return this.prisma.stageVerseSubmission.upsert({
      where: {
        eventId_userId: { eventId: dto.eventId, userId },
      },
      update: {
        trackTitle: dto.trackTitle,
        audioVideoUrl: dto.audioVideoUrl,
        status: "PENDING",
      },
      create: {
        eventId: dto.eventId,
        userId,
        trackTitle: dto.trackTitle,
        audioVideoUrl: dto.audioVideoUrl,
      },
    });
  }

  async listSubmissions(eventId: string) {
    const subs = await this.prisma.stageVerseSubmission.findMany({
      where: { eventId, status: { in: ["APPROVED", "SKIPPED"] } },
      include: {
        user: true,
        judgeScores: true,
        votes: true,
      },
      orderBy: { performanceOrder: "asc" },
    });

    let needsUpdate = false;
    for (let i = 0; i < subs.length; i++) {
      if (subs[i].performanceOrder !== i + 1) {
        subs[i].performanceOrder = i + 1;
        needsUpdate = true;
      }
    }

    if (needsUpdate) {
      for (const sub of subs) {
        await this.prisma.stageVerseSubmission.update({
          where: { id: sub.id },
          data: { performanceOrder: sub.performanceOrder }
        });
      }
    }

    return subs;
  }

  async submitJudgeScore(judgeId: string, submissionId: string, dto: SubmitScoreDto) {
    const submission = await this.prisma.stageVerseSubmission.findFirst({
      where: {
        OR: [
          { id: submissionId },
          { userId: submissionId }
        ]
      },
      include: { event: true },
    });

    if (!submission) {
      throw new NotFoundException("Submission not found");
    }

    const score = await this.prisma.judgeScore.upsert({
      where: {
        submissionId_judgeId: { submissionId, judgeId },
      },
      update: {
        originalityScore: dto.originalityScore,
        technicalityScore: dto.technicalityScore,
        engagementScore: dto.engagementScore,
        feedback: dto.feedback,
      },
      create: {
        submissionId,
        judgeId,
        originalityScore: dto.originalityScore,
        technicalityScore: dto.technicalityScore,
        engagementScore: dto.engagementScore,
        feedback: dto.feedback,
      },
    });

    const standings = await this.calculateStandings(submission.eventId);
    this.gateway.broadcastLeaderboard(submission.eventId, standings);

    return score;
  }

  async castVote(voterId: string, submissionId: string, score: number = 5.0) {
    const submission = await this.prisma.stageVerseSubmission.findFirst({
      where: {
        OR: [
          { id: submissionId },
          { userId: submissionId }
        ]
      },
      include: { user: { select: { fullName: true } } },
    });

    if (!submission) {
      throw new NotFoundException("Submission not found");
    }

    const event = await this.prisma.event.findUnique({
      where: { id: submission.eventId },
      select: { votingActive: true }
    });
    const isVotingOpen = event ? (event.votingActive ?? false) : false;
    if (!isVotingOpen) {
      throw new ConflictException("Voting is currently closed for this event.");
    }

    const existing = await this.prisma.vote.findUnique({
      where: {
        submissionId_voterId: { submissionId, voterId },
      },
    });

    if (existing) {
      throw new ConflictException("You have already rated this performer");
    }

    const vote = await this.prisma.vote.create({
      data: {
        submissionId,
        voterId,
        score,
      },
    });

    this.gateway.broadcastLiveVote(submission.eventId, {
      performer: submission.user?.fullName || "Custom Performer",
      votedAt: vote.createdAt,
    });

    const standings = await this.calculateStandings(submission.eventId);
    this.gateway.broadcastLeaderboard(submission.eventId, standings);

    return { success: true, message: "Vote cast successfully" };
  }

  async calculateStandings(eventId: string) {
    const submissions = await this.prisma.stageVerseSubmission.findMany({
      where: { eventId, status: "APPROVED" },
      include: {
        user: true,
        judgeScores: true,
        votes: true,
      },
    });

    const standings = submissions.map((sub: any) => {
      const votes = sub.votes || [];
      const votesCount = votes.length;
      let audienceAvg = 0.0;
      if (votesCount > 0) {
        const totalVoteScore = votes.reduce((acc: number, v: any) => acc + (v.score ?? 5.0), 0);
        audienceAvg = totalVoteScore / votesCount;
      }

      const scores = sub.judgeScores || sub.scores || [];
      let judgeAvg = 0.0;
      if (scores.length > 0) {
        const totalJudgeScore = scores.reduce(
          (acc: number, s: any) => acc + (s.originalityScore + s.technicalityScore + s.engagementScore) / 3,
          0,
        );
        judgeAvg = totalJudgeScore / scores.length;
      }

      // Standings Formula: 50% audience rating average + 50% judge score average
      // Both are scaled out of 10, totalScore is out of 100
      const totalScore = audienceAvg * 5.0 + judgeAvg * 5.0;

      return {
        submissionId: sub.id,
        performer: sub.user?.fullName || "Custom Performer",
        photoUrl: sub.user?.profilePhotoUrl || "",
        trackTitle: sub.trackTitle,
        votesCount,
        audienceAverage: Number(audienceAvg.toFixed(2)),
        judgeAverage: Number(judgeAvg.toFixed(2)),
        totalScore: Number(totalScore.toFixed(2)),
      };
    });

    return standings.sort((a: any, b: any) => b.totalScore - a.totalScore);
  }

  async addUnregisteredArtist(userId: string, roles: string[], eventId: string, performerName: string, trackTitle: string, audioVideoUrl?: string) {
    await this.assertOrganizerAccess(eventId, userId, roles);

    const event = await this.prisma.event.findUnique({
      where: { id: eventId }
    });
    if (!event) throw new NotFoundException("Event not found");

    const crypto = require("crypto");
    const uuid = crypto.randomUUID();
    const email = `unregistered_${Date.now()}_${Math.floor(Math.random() * 1000)}@element5.com`;
    const bcrypt = require("bcrypt");
    const passwordHash = await bcrypt.hash("ghostPassword123", 10);

    const ghostUser = await this.prisma.user.create({
      data: {
        id: uuid,
        email,
        fullName: performerName,
        passwordHash,
        status: "ACTIVE",
        roles: {
          create: { role: "ARTIST" }
        }
      }
    });

    await this.prisma.artistProfile.create({
      data: {
        id: crypto.randomUUID(),
        userId: ghostUser.id,
        stageName: performerName,
        genres: ["Creative Art"],
        skills: ["Creative Art"]
      }
    });

    const count = await this.prisma.stageVerseSubmission.count({
      where: { eventId }
    });

    const submission = await this.prisma.stageVerseSubmission.create({
      data: {
        id: crypto.randomUUID(),
        eventId,
        userId: ghostUser.id,
        trackTitle,
        audioVideoUrl: audioVideoUrl || "",
        performanceOrder: count + 1,
        status: "APPROVED"
      }
    });

    const standings = await this.calculateStandings(eventId);
    this.gateway.broadcastLeaderboard(eventId, standings);

    return submission;
  }

  async addRegisteredArtist(userId: string, roles: string[], eventId: string, artistUserId: string, trackTitle: string, audioVideoUrl?: string) {
    await this.assertOrganizerAccess(eventId, userId, roles);

    const event = await this.prisma.event.findUnique({
      where: { id: eventId }
    });
    if (!event) throw new NotFoundException("Event not found");

    const crypto = require("crypto");
    const count = await this.prisma.stageVerseSubmission.count({
      where: { eventId }
    });

    const submission = await this.prisma.stageVerseSubmission.upsert({
      where: {
        eventId_userId: { eventId, userId: artistUserId }
      },
      update: {
        trackTitle,
        audioVideoUrl: audioVideoUrl || "",
        status: "APPROVED"
      },
      create: {
        id: crypto.randomUUID(),
        eventId,
        userId: artistUserId,
        trackTitle,
        audioVideoUrl: audioVideoUrl || "",
        performanceOrder: count + 1,
        status: "APPROVED"
      }
    });

    const standings = await this.calculateStandings(eventId);
    this.gateway.broadcastLeaderboard(eventId, standings);

    return submission;
  }

  async requestVotingAccess(eventId: string, userId: string) {
    const existing = await this.prisma.votingAccessRequest.findUnique({
      where: {
        eventId_userId: { eventId, userId }
      }
    });

    if (existing) {
      return existing;
    }

    return this.prisma.votingAccessRequest.create({
      data: {
        eventId,
        userId,
        status: "PENDING"
      }
    });
  }

  async listVotingAccessRequests(userId: string, roles: string[], eventId: string) {
    await this.assertOrganizerAccess(eventId, userId, roles);
    return this.prisma.votingAccessRequest.findMany({
      where: { eventId },
      include: { user: true },
      orderBy: { createdAt: "desc" }
    });
  }

  async reviewVotingAccessRequest(userId: string, roles: string[], requestId: string, status: "APPROVED" | "REJECTED") {
    const req = await this.prisma.votingAccessRequest.findUnique({
      where: { id: requestId }
    });
    if (!req) {
      throw new NotFoundException("Request not found");
    }
    await this.assertOrganizerAccess(req.eventId, userId, roles);

    return this.prisma.votingAccessRequest.update({
      where: { id: requestId },
      data: { status }
    });
  }

  async checkVotingAccess(eventId: string, userId: string) {
    const registration = await this.prisma.eventRegistration.findFirst({
      where: {
        eventId,
        userId,
        paymentStatus: "APPROVED"
      }
    });

    if (registration) {
      return { allowed: true, status: "APPROVED" };
    }

    const request = await this.prisma.votingAccessRequest.findUnique({
      where: {
        eventId_userId: { eventId, userId }
      }
    });

    if (request) {
      return {
        allowed: request.status === "APPROVED",
        status: request.status
      };
    }

    return { allowed: false, status: "NOT_REQUESTED" };
  }

  async updateSubmissionDetails(userId: string, roles: string[], submissionId: string, dto: { trackTitle?: string, performerName?: string }) {
    const sub = await this.prisma.stageVerseSubmission.findUnique({
      where: { id: submissionId },
      include: { user: true }
    });
    if (!sub) throw new NotFoundException("Submission not found");
    await this.assertOrganizerAccess(sub.eventId, userId, roles);

    const updateData: any = {};
    if (dto.trackTitle !== undefined) {
      updateData.trackTitle = dto.trackTitle;
    }

    if (dto.performerName !== undefined && sub.user) {
      if (sub.user.email.startsWith("unregistered_")) {
        await this.prisma.user.update({
          where: { id: sub.userId },
          data: { fullName: dto.performerName }
        });
      }
    }

    const updatedSub = await this.prisma.stageVerseSubmission.update({
      where: { id: submissionId },
      data: updateData,
      include: { user: true }
    });

    const standings = await this.calculateStandings(sub.eventId);
    this.gateway.broadcastLeaderboard(sub.eventId, standings);

    return updatedSub;
  }

  async updateSubmissionOrder(userId: string, roles: string[], submissionId: string, performanceOrder: number) {
    const sub = await this.prisma.stageVerseSubmission.findUnique({
      where: { id: submissionId }
    });
    if (!sub) throw new NotFoundException("Submission not found");
    await this.assertOrganizerAccess(sub.eventId, userId, roles);

    const updatedSub = await this.prisma.stageVerseSubmission.update({
      where: { id: submissionId },
      data: { performanceOrder }
    });

    return updatedSub;
  }

  async updateSubmissionStatus(userId: string, roles: string[], submissionId: string, status: string) {
    const sub = await this.prisma.stageVerseSubmission.findUnique({
      where: { id: submissionId }
    });
    if (!sub) throw new NotFoundException("Submission not found");
    await this.assertOrganizerAccess(sub.eventId, userId, roles);

    const updatedSub = await this.prisma.stageVerseSubmission.update({
      where: { id: submissionId },
      data: { status }
    });

    const standings = await this.calculateStandings(sub.eventId);
    this.gateway.broadcastLeaderboard(sub.eventId, standings);

    return updatedSub;
  }

  async deleteSubmission(userId: string, roles: string[], submissionId: string) {
    const sub = await this.prisma.stageVerseSubmission.findUnique({
      where: { id: submissionId }
    });
    if (!sub) throw new NotFoundException("Submission not found");
    await this.assertOrganizerAccess(sub.eventId, userId, roles);

    await this.prisma.stageVerseSubmission.delete({
      where: { id: submissionId }
    });

    const standings = await this.calculateStandings(sub.eventId);
    this.gateway.broadcastLeaderboard(sub.eventId, standings);

    return { success: true };
  }

  async getRegisteredArtists(userId: string, roles: string[], eventId: string) {
    await this.assertOrganizerAccess(eventId, userId, roles);

    const registrations = await this.prisma.eventRegistration.findMany({
      where: { eventId },
      select: { userId: true }
    });

    const userIds = registrations.map((r: any) => r.userId).filter(Boolean);
    if (userIds.length === 0) return [];

    const profiles = await this.prisma.artistProfile.findMany({
      where: { userId: { in: userIds } },
      include: { user: true }
    });

    return profiles;
  }

  async setCurrentPerformer(userId: string, roles: string[], eventId: string, submissionId: string | null) {
    await this.assertOrganizerAccess(eventId, userId, roles);

    await this.prisma.event.update({
      where: { id: eventId },
      data: { currentPerformerId: submissionId }
    });

    this.gateway.broadcastCurrentPerformer(eventId, submissionId);

    return { currentPerformerId: submissionId };
  }

  async addBulkUnregisteredArtists(userId: string, roles: string[], eventId: string, names: string[]) {
    await this.assertOrganizerAccess(eventId, userId, roles);

    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw new NotFoundException("Event not found");

    const crypto = require("crypto");
    const bcrypt = require("bcrypt");
    const passwordHash = await bcrypt.hash("ghostPassword123", 10);

    let currentCount = await this.prisma.stageVerseSubmission.count({ where: { eventId } });
    const results: any[] = [];

    for (const name of names) {
      if (!name.trim()) continue;

      const uuid = crypto.randomUUID();
      const email = `unregistered_${Date.now()}_${Math.floor(Math.random() * 10000)}@element5.com`;

      const ghostUser = await this.prisma.user.create({
        data: {
          id: uuid,
          email,
          fullName: name.trim(),
          passwordHash,
          status: "ACTIVE",
          roles: { create: { role: "ARTIST" } }
        }
      });

      await this.prisma.artistProfile.create({
        data: {
          id: crypto.randomUUID(),
          userId: ghostUser.id,
          stageName: name.trim(),
          genres: ["Performance Art"],
          skills: ["Performance Art"]
        }
      });

      currentCount++;
      const submission = await this.prisma.stageVerseSubmission.create({
        data: {
          id: crypto.randomUUID(),
          eventId,
          userId: ghostUser.id,
          trackTitle: "Performance",
          audioVideoUrl: "",
          performanceOrder: currentCount,
          status: "APPROVED"
        }
      });

      results.push(submission);
    }

    const standings = await this.calculateStandings(eventId);
    this.gateway.broadcastLeaderboard(eventId, standings);

    return { added: results.length, submissions: results };
  }
}

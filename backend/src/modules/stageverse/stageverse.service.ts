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

  private async assertOrganizerAccess(eventId: string, organizerId: string, rolesInput: any = []) {
    const roles: string[] = Array.isArray(rolesInput)
      ? rolesInput
      : typeof rolesInput === "string"
      ? [rolesInput]
      : [];

    if (roles.includes("SUPER_ADMIN")) return;

    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException("Event not found");
    }

    if (event.organizerId && event.organizerId !== organizerId && !roles.includes("ORG_ADMIN")) {
      throw new ForbiddenException("You do not have access to this event");
    }
  }

  private panelStates = new Map<string, boolean>();
  private performanceStates = new Map<string, boolean>();
  private performanceExpiresAt = new Map<string, number | null>();

  async getRealEvent(eventId: string) {
    return this.prisma.event.findFirst({
      where: { OR: [{ id: eventId }, { slug: eventId }] },
    });
  }

  async togglePerformance(userId: string, roles: string[], eventId: string, open: boolean, durationSeconds?: number) {
    const event = await this.getRealEvent(eventId);
    const targetId = event ? event.id : eventId;
    await this.assertOrganizerAccess(targetId, userId, roles);

    const expiresAt = open && durationSeconds ? Date.now() + durationSeconds * 1000 : null;

    if (event) {
      await this.prisma.event.update({
        where: { id: event.id },
        data: { 
          votingActive: open,
          votingExpiresAt: expiresAt ? new Date(expiresAt) : null
        }
      });
    }

    this.panelStates.set(targetId, open);
    this.performanceStates.set(targetId, open);
    this.performanceExpiresAt.set(targetId, expiresAt);

    if (event?.slug) {
      this.panelStates.set(event.slug, open);
      this.performanceStates.set(event.slug, open);
      this.performanceExpiresAt.set(event.slug, expiresAt);
    }

    const payload = { performanceLive: open, expiresAt };
    this.gateway.server.to(targetId).emit("performanceStatusUpdate", payload);
    this.gateway.server.to(targetId).emit("panelStatusUpdate", { panelOpen: open });
    if (event?.slug) {
      this.gateway.server.to(event.slug).emit("performanceStatusUpdate", payload);
      this.gateway.server.to(event.slug).emit("panelStatusUpdate", { panelOpen: open });
    }

    return { success: true, performanceLive: open, expiresAt };
  }

  async toggleVotingPanel(userId: string, roles: string[], eventId: string, open: boolean) {
    const event = await this.getRealEvent(eventId);
    const targetId = event ? event.id : eventId;
    await this.assertOrganizerAccess(targetId, userId, roles);

    if (event) {
      await this.prisma.event.update({
        where: { id: event.id },
        data: { votingActive: open, votingExpiresAt: null }
      });
    }

    this.panelStates.set(targetId, open);
    if (event?.slug) this.panelStates.set(event.slug, open);

    // Opening or closing the panel closes any performer active voting session by default
    this.votingStates.set(targetId, false);
    if (event?.slug) this.votingStates.set(event.slug, false);

    this.gateway.server.to(targetId).emit("panelStatusUpdate", { panelOpen: open });
    if (event?.slug) {
      this.gateway.server.to(event.slug).emit("panelStatusUpdate", { panelOpen: open });
    }

    const payload = { open: false, expiresAt: null };
    this.gateway.server.to(targetId).emit("votingStatusUpdate", payload);
    if (event?.slug) {
      this.gateway.server.to(event.slug).emit("votingStatusUpdate", payload);
    }

    return { success: true, panelOpen: open, open: false };
  }

  async toggleVoting(userId: string, roles: string[], eventId: string, open: boolean, durationSeconds?: number) {
    const event = await this.getRealEvent(eventId);
    const targetId = event ? event.id : eventId;
    await this.assertOrganizerAccess(targetId, userId, roles);
    const expiresAt = open && durationSeconds ? new Date(Date.now() + durationSeconds * 1000) : null;

    if (event) {
      await this.prisma.event.update({
        where: { id: event.id },
        data: { 
          votingActive: true,
          votingExpiresAt: expiresAt
        }
      });
    }

    this.panelStates.set(targetId, true);
    if (event?.slug) this.panelStates.set(event.slug, true);

    this.votingStates.set(targetId, open);
    if (event?.slug) this.votingStates.set(event.slug, open);

    const payload = { open, expiresAt: expiresAt ? expiresAt.getTime() : null };
    this.gateway.server.to(targetId).emit("votingStatusUpdate", payload);
    if (event?.slug) {
      this.gateway.server.to(event.slug).emit("votingStatusUpdate", payload);
    }
    return { success: true, open, expiresAt: expiresAt ? expiresAt.getTime() : null };
  }

  async getVotingStatus(eventId: string) {
    const event = await this.getRealEvent(eventId);
    const targetId = event ? event.id : eventId;

    let expiresAt = event?.votingExpiresAt ? new Date(event.votingExpiresAt).getTime() : null;
    let dbVotingActive = event?.votingActive ?? false;

    let panelOpen = dbVotingActive || (this.panelStates.get(targetId) ?? (event?.slug ? this.panelStates.get(event.slug) : undefined) ?? false);
    
    let inMemoryOpen = this.votingStates.get(targetId) ?? (event?.slug ? this.votingStates.get(event.slug) : undefined) ?? false;
    let open = inMemoryOpen && (expiresAt === null || expiresAt > Date.now());

    if (open && expiresAt !== null && expiresAt < Date.now()) {
      open = false;
      expiresAt = null;
      if (event) {
        await this.prisma.event.update({
          where: { id: event.id },
          data: { votingExpiresAt: null }
        });
      }
      this.votingStates.set(targetId, false);
      if (event?.slug) this.votingStates.set(event.slug, false);
      const payload = { open: false, expiresAt: null };
      this.gateway.server.to(targetId).emit("votingStatusUpdate", payload);
      if (event?.slug) {
        this.gateway.server.to(event.slug).emit("votingStatusUpdate", payload);
      }
    }

    let perfLive = (dbVotingActive && !open) || (this.performanceStates.get(targetId) ?? (event?.slug ? this.performanceStates.get(event.slug) : undefined) ?? false);
    let perfExpiresAt = (this.performanceExpiresAt.get(targetId) ?? (event?.slug ? this.performanceExpiresAt.get(event.slug) : undefined) ?? (expiresAt && expiresAt > Date.now() ? expiresAt : null));

    if (perfLive && perfExpiresAt !== null && perfExpiresAt < Date.now()) {
      perfLive = false;
      perfExpiresAt = null;
      this.performanceStates.set(targetId, false);
      this.performanceExpiresAt.set(targetId, null);
      if (event?.slug) {
        this.performanceStates.set(event.slug, false);
        this.performanceExpiresAt.set(event.slug, null);
      }
      const payload = { performanceLive: false, expiresAt: null };
      this.gateway.server.to(targetId).emit("performanceStatusUpdate", payload);
      if (event?.slug) {
        this.gateway.server.to(event.slug).emit("performanceStatusUpdate", payload);
      }
    }

    return { 
      panelOpen, 
      open, 
      expiresAt, 
      performanceLive: perfLive,
      performanceExpiresAt: perfExpiresAt,
      currentPerformerId: event?.currentPerformerId ?? null 
    };
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

    let submission = await this.prisma.stageVerseSubmission.findFirst({
      where: { eventId: dto.eventId, userId }
    });

    if (submission) {
      return this.prisma.stageVerseSubmission.update({
        where: { id: submission.id },
        data: {
          trackTitle: dto.trackTitle,
          audioVideoUrl: dto.audioVideoUrl,
          status: "PENDING",
        }
      });
    } else {
      return this.prisma.stageVerseSubmission.create({
        data: {
          id: require("crypto").randomUUID(),
          eventId: dto.eventId,
          userId,
          trackTitle: dto.trackTitle,
          audioVideoUrl: dto.audioVideoUrl,
        }
      });
    }
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
        submissionId_voterId: { submissionId: submission.id, voterId },
      },
    });

    let vote: any;
    if (existing) {
      vote = await this.prisma.vote.update({
        where: { id: existing.id },
        data: { score },
      });
    } else {
      vote = await this.prisma.vote.create({
        data: {
          submissionId: submission.id,
          voterId,
          score,
        },
      });
    }

    this.gateway.broadcastLiveVote(submission.eventId, {
      performer: submission.user?.fullName || "Custom Performer",
      votedAt: vote.createdAt || vote.updatedAt,
    });

    const standings = await this.calculateStandings(submission.eventId);
    this.gateway.broadcastLeaderboard(submission.eventId, standings);

    return { success: true, message: "Vote cast successfully", score };
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

      // Standings Formula:
      // If separate judge scores exist: 50% Audience Avg + 50% Judge Avg.
      // If no separate judges exist (Audience is the Judge): 100% Audience Avg (scaled out of 100).
      let totalScore = 0.0;
      if (scores.length > 0 && judgeAvg > 0) {
        totalScore = audienceAvg * 5.0 + judgeAvg * 5.0;
      } else {
        totalScore = audienceAvg * 10.0;
      }

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

    let submission = await this.prisma.stageVerseSubmission.findFirst({
      where: { eventId, userId: artistUserId }
    });

    if (submission) {
      submission = await this.prisma.stageVerseSubmission.update({
        where: { id: submission.id },
        data: {
          trackTitle,
          audioVideoUrl: audioVideoUrl || "",
          status: "APPROVED"
        }
      });
    } else {
      submission = await this.prisma.stageVerseSubmission.create({
        data: {
          id: crypto.randomUUID(),
          eventId,
          userId: artistUserId,
          trackTitle,
          audioVideoUrl: audioVideoUrl || "",
          performanceOrder: count + 1,
          status: "APPROVED"
        }
      });
    }

    const standings = await this.calculateStandings(eventId);
    this.gateway.broadcastLeaderboard(eventId, standings);

    return submission;
  }

  async requestVotingAccess(eventId: string, userId: string) {
    const existing = await this.prisma.votingAccessRequest.findFirst({
      where: { eventId, userId }
    });

    if (existing) {
      this.gateway.broadcastVotingAccessUpdate(eventId, userId, existing.status);
      return existing;
    }

    const req = await this.prisma.votingAccessRequest.create({
      data: {
        eventId,
        userId,
        status: "PENDING"
      }
    });

    this.gateway.broadcastVotingAccessUpdate(eventId, userId, "PENDING");
    this.gateway.broadcastVotingAccessRequest(eventId, userId, req);
    return req;
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

    const updated = await this.prisma.votingAccessRequest.update({
      where: { id: requestId },
      data: { status }
    });

    this.gateway.broadcastVotingAccessUpdate(req.eventId, req.userId, status);
    return updated;
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

    const request = await this.prisma.votingAccessRequest.findFirst({
      where: { eventId, userId }
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
    const realEvent = await this.getRealEvent(eventId);
    const targetId = realEvent ? realEvent.id : eventId;
    await this.assertOrganizerAccess(targetId, userId, roles);

    // Get registrations ONLY for this specific active event
    const registrations = await this.prisma.eventRegistration.findMany({
      where: { eventId: targetId },
      include: { 
        user: { 
          include: { 
            artistProfile: true 
          } 
        } 
      }
    });

    // Get existing lineup submissions to exclude artists ALREADY added to the lineup
    const existingSubmissions = await this.prisma.stageVerseSubmission.findMany({
      where: { eventId: targetId },
      select: { userId: true }
    });
    const existingUserIds = new Set(existingSubmissions.map((s: any) => s.userId).filter(Boolean));

    const resultList: any[] = [];
    const addedUserIds = new Set<string>();

    for (const reg of registrations) {
      if (!reg.user || addedUserIds.has(reg.user.id)) continue;
      
      // Exclude artists already in the event lineup
      if (existingUserIds.has(reg.user.id)) continue;

      const customData = (reg.customData as any) || {};
      const artistProf = reg.user.artistProfile;

      // Filter specifically for users who registered as an ARTIST for this event (or have an Artist Profile / ARTIST role)
      const isRegisteredAsArtist = 
        customData.participationType === "ARTIST" || 
        reg.user.role === "ARTIST" || 
        !!artistProf ||
        (Array.isArray((reg.user as any).roles) && (reg.user as any).roles.some((r: any) => r === "ARTIST" || r?.role === "ARTIST"));

      if (!isRegisteredAsArtist) continue;

      addedUserIds.add(reg.user.id);

      const stageName = customData.stageName || artistProf?.stageName || reg.user.fullName || "Registered Artist";
      const genre = customData.genre || (artistProf?.genres && artistProf.genres.length > 0 ? artistProf.genres.join(", ") : artistProf?.genre) || "Performance Art";

      resultList.push({
        id: artistProf?.id || `reg_${reg.id}`,
        userId: reg.user.id,
        stageName,
        genres: genre ? [genre] : [],
        user: {
          id: reg.user.id,
          fullName: reg.user.fullName,
          email: reg.user.email,
          profilePhotoUrl: reg.user.profilePhotoUrl
        }
      });
    }

    return resultList;
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

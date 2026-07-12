import { Injectable, NotFoundException, ConflictException, Inject, forwardRef } from "@nestjs/common";
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

  async toggleVoting(eventId: string, open: boolean) {
    this.votingStates.set(eventId, open);
    this.gateway.server.to(eventId).emit("votingStatusUpdate", { open });
    return { success: true, open };
  }

  async getVotingStatus(eventId: string) {
    return { open: this.votingStates.get(eventId) ?? false };
  }

  async resetVotes(eventId: string) {
    const submissions = await this.prisma.stageVerseSubmission.findMany({
      where: { eventId },
      select: { id: true },
    });
    const subIds = submissions.map((s) => s.id);
    await this.prisma.vote.deleteMany({
      where: { submissionId: { in: subIds } },
    });

    const standings = await this.calculateStandings(eventId);
    this.gateway.broadcastLeaderboard(eventId, standings);

    return { success: true, message: "All votes reset successfully" };
  }

  async submitTrack(userId: string, dto: SubmitTrackDto) {
    // Check if event exists
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
        status: "PENDING", // Reset to pending for review
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
    return this.prisma.stageVerseSubmission.findMany({
      where: { eventId, status: "APPROVED" },
      include: {
        user: { select: { fullName: true, profilePhotoUrl: true } },
        scores: true,
        votes: true,
      },
      orderBy: { performanceOrder: "asc" },
    });
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

    // Recalculate standings and broadcast
    const standings = await this.calculateStandings(submission.eventId);
    this.gateway.broadcastLeaderboard(submission.eventId, standings);

    return score;
  }

  async castVote(voterId: string, submissionId: string) {
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

    const isVotingOpen = this.votingStates.get(submission.eventId) ?? false;
    if (!isVotingOpen) {
      throw new ConflictException("Voting is currently closed for this event.");
    }

    const existing = await this.prisma.vote.findUnique({
      where: {
        submissionId_voterId: { submissionId, voterId },
      },
    });

    if (existing) {
      throw new ConflictException("You have already voted for this performer");
    }

    const vote = await this.prisma.vote.create({
      data: {
        submissionId,
        voterId,
      },
    });

    // Notify rooms about the live vote event
    this.gateway.broadcastLiveVote(submission.eventId, {
      performer: submission.user.fullName,
      votedAt: vote.createdAt,
    });

    // Recalculate standings and broadcast
    const standings = await this.calculateStandings(submission.eventId);
    this.gateway.broadcastLeaderboard(submission.eventId, standings);

    return { success: true, message: "Vote cast successfully" };
  }

  async calculateStandings(eventId: string) {
    const submissions = await this.prisma.stageVerseSubmission.findMany({
      where: { eventId, status: "APPROVED" },
      include: {
        user: { select: { fullName: true, profilePhotoUrl: true } },
        scores: true,
        votes: { select: { weight: true } },
      },
    });

    const standings = submissions.map((sub) => {
      const votesCount = sub.votes.reduce((acc: number, v: any) => acc + v.weight, 0);

      // Compute judge average score
      let judgeAvg = 0.0;
      if (sub.scores.length > 0) {
        const totalJudgeScore = sub.scores.reduce(
          (acc: number, s: any) => acc + (s.originalityScore + s.technicalityScore + s.engagementScore) / 3,
          0,
        );
        judgeAvg = totalJudgeScore / sub.scores.length;
      }

      // Standings Formula: 40% votes count normalized + 60% judge score normalized
      // For responsiveness: Total Score = (Votes * 1) + (JudgeAvg * 10)
      const totalScore = votesCount * 1.0 + judgeAvg * 10.0;

      return {
        submissionId: sub.id,
        performer: sub.user.fullName,
        photoUrl: sub.user.profilePhotoUrl,
        trackTitle: sub.trackTitle,
        votesCount,
        judgeAverage: Number(judgeAvg.toFixed(2)),
        totalScore: Number(totalScore.toFixed(2)),
      };
    });

    // Sort descending
    return standings.sort((a, b) => b.totalScore - a.totalScore);
  }
}

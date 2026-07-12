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
exports.StageVerseService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const stageverse_gateway_1 = require("./stageverse.gateway");
let StageVerseService = class StageVerseService {
    prisma;
    gateway;
    constructor(prisma, gateway) {
        this.prisma = prisma;
        this.gateway = gateway;
    }
    votingStates = new Map();
    async toggleVoting(eventId, open) {
        this.votingStates.set(eventId, open);
        this.gateway.server.to(eventId).emit("votingStatusUpdate", { open });
        return { success: true, open };
    }
    async getVotingStatus(eventId) {
        return { open: this.votingStates.get(eventId) ?? false };
    }
    async resetVotes(eventId) {
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
    async submitTrack(userId, dto) {
        const event = await this.prisma.event.findUnique({
            where: { id: dto.eventId },
        });
        if (!event) {
            throw new common_1.NotFoundException("Event not found");
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
    async listSubmissions(eventId) {
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
    async submitJudgeScore(judgeId, submissionId, dto) {
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
            throw new common_1.NotFoundException("Submission not found");
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
    async castVote(voterId, submissionId) {
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
            throw new common_1.NotFoundException("Submission not found");
        }
        const isVotingOpen = this.votingStates.get(submission.eventId) ?? false;
        if (!isVotingOpen) {
            throw new common_1.ConflictException("Voting is currently closed for this event.");
        }
        const existing = await this.prisma.vote.findUnique({
            where: {
                submissionId_voterId: { submissionId, voterId },
            },
        });
        if (existing) {
            throw new common_1.ConflictException("You have already voted for this performer");
        }
        const vote = await this.prisma.vote.create({
            data: {
                submissionId,
                voterId,
            },
        });
        this.gateway.broadcastLiveVote(submission.eventId, {
            performer: submission.user.fullName,
            votedAt: vote.createdAt,
        });
        const standings = await this.calculateStandings(submission.eventId);
        this.gateway.broadcastLeaderboard(submission.eventId, standings);
        return { success: true, message: "Vote cast successfully" };
    }
    async calculateStandings(eventId) {
        const submissions = await this.prisma.stageVerseSubmission.findMany({
            where: { eventId, status: "APPROVED" },
            include: {
                user: { select: { fullName: true, profilePhotoUrl: true } },
                scores: true,
                votes: { select: { weight: true } },
            },
        });
        const standings = submissions.map((sub) => {
            const votesCount = sub.votes.reduce((acc, v) => acc + v.weight, 0);
            let judgeAvg = 0.0;
            if (sub.scores.length > 0) {
                const totalJudgeScore = sub.scores.reduce((acc, s) => acc + (s.originalityScore + s.technicalityScore + s.engagementScore) / 3, 0);
                judgeAvg = totalJudgeScore / sub.scores.length;
            }
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
        return standings.sort((a, b) => b.totalScore - a.totalScore);
    }
};
exports.StageVerseService = StageVerseService;
exports.StageVerseService = StageVerseService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)((0, common_1.forwardRef)(() => stageverse_gateway_1.StageVerseGateway))),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        stageverse_gateway_1.StageVerseGateway])
], StageVerseService);
//# sourceMappingURL=stageverse.service.js.map
import { PrismaService } from "../../prisma/prisma.service";
import { SubmitTrackDto } from "./dto/submit-track.dto";
import { SubmitScoreDto } from "./dto/submit-score.dto";
import { StageVerseGateway } from "./stageverse.gateway";
export declare class StageVerseService {
    private prisma;
    private gateway;
    constructor(prisma: PrismaService, gateway: StageVerseGateway);
    submitTrack(userId: string, dto: SubmitTrackDto): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.SubmissionStatus;
        createdAt: Date;
        updatedAt: Date;
        eventId: string;
        userId: string;
        trackTitle: string;
        audioVideoUrl: string;
        performanceOrder: number | null;
    }>;
    listSubmissions(eventId: string): Promise<({
        votes: {
            id: string;
            createdAt: Date;
            submissionId: string;
            voterId: string;
            weight: number;
        }[];
        user: {
            fullName: string;
            profilePhotoUrl: string | null;
        };
        scores: {
            id: string;
            createdAt: Date;
            submissionId: string;
            judgeId: string;
            originalityScore: number;
            technicalityScore: number;
            engagementScore: number;
            feedback: string | null;
        }[];
    } & {
        id: string;
        status: import("@prisma/client").$Enums.SubmissionStatus;
        createdAt: Date;
        updatedAt: Date;
        eventId: string;
        userId: string;
        trackTitle: string;
        audioVideoUrl: string;
        performanceOrder: number | null;
    })[]>;
    submitJudgeScore(judgeId: string, submissionId: string, dto: SubmitScoreDto): Promise<{
        id: string;
        createdAt: Date;
        submissionId: string;
        judgeId: string;
        originalityScore: number;
        technicalityScore: number;
        engagementScore: number;
        feedback: string | null;
    }>;
    castVote(voterId: string, submissionId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    calculateStandings(eventId: string): Promise<{
        submissionId: string;
        performer: string;
        photoUrl: string | null;
        trackTitle: string;
        votesCount: number;
        judgeAverage: number;
        totalScore: number;
    }[]>;
}

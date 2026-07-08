import { StageVerseService } from "./stageverse.service";
import { SubmitTrackDto } from "./dto/submit-track.dto";
import { SubmitScoreDto } from "./dto/submit-score.dto";
export declare class StageVerseController {
    private stageVerseService;
    constructor(stageVerseService: StageVerseService);
    submit(user: any, dto: SubmitTrackDto): Promise<{
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
    getSubmissions(eventId: string): Promise<({
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
    score(user: any, subId: string, dto: SubmitScoreDto): Promise<{
        id: string;
        createdAt: Date;
        submissionId: string;
        judgeId: string;
        originalityScore: number;
        technicalityScore: number;
        engagementScore: number;
        feedback: string | null;
    }>;
    vote(user: any, subId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getStandings(eventId: string): Promise<{
        submissionId: string;
        performer: string;
        photoUrl: string | null;
        trackTitle: string;
        votesCount: number;
        judgeAverage: number;
        totalScore: number;
    }[]>;
}
